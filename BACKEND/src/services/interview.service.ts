import type {
  EvaluateAnswerContext,
  GenerateQuestionContext,
} from "../ai/ai.provider";
import { env } from "../config/env";
import type { Evaluation, Difficulty } from "../models/evaluation.types";
import type { InterviewFeedback } from "../models/feedback.types";
import type {
  InterviewSession,
  InterviewStatus,
  Question,
  QuestionType,
} from "../models/interview.types";
import type { InterviewRepository } from "../repositories/interview.repository";
import { InMemoryInterviewRepository } from "../repositories/interview.repository";
import { AppError } from "../utils/errors";
import { generateId } from "../utils/id";
import type { Logger } from "../utils/logger";
import { determineDifficulty } from "./evaluation.service";
import { getEvaluations, getPreviousTurn, lastEvaluation } from "./history";
import type { AIService } from "./ai.service";
import type { CandidateService } from "./candidate.service";
import type { CurriculumService } from "./curriculum.service";
import type { FeedbackService } from "./feedback.service";

export interface StartInterviewInput {
  candidateId: string;
  curriculumId: string;
  totalQuestions?: number;
}

export interface SubmitAnswerInput {
  interviewId: string;
  answer: string;
}

export type StartInterviewResult = {
  interview: PublicInterview;
  question: Question;
};

export type SubmitAnswerResult =
  | { completed: false; interviewId: string; questionNumber: number; evaluation: Evaluation; question: Question }
  | { completed: true; interviewId: string; questionNumber: number; evaluation: Evaluation; feedback: InterviewFeedback };

export interface PublicInterview {
  id: string;
  candidate: { id: string; name: string; experience: number; skills: string[] };
  curriculum: { id: string; title: string };
  status: InterviewStatus;
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  currentTopic: string;
  currentDifficulty: Difficulty;
  questions: Question[];
  history: InterviewSession["history"];
  feedback: InterviewFeedback | null;
  error: { code: string; message: string } | null;
  startedAt: string;
  endedAt: string | null;
}

export class InterviewService {
  /** Interview ids with a submit/end operation currently in flight (double-submit guard). */
  private readonly inFlight = new Set<string>();

  constructor(
    private readonly candidateService: CandidateService,
    private readonly curriculumService: CurriculumService,
    private readonly aiService: AIService,
    private readonly feedbackService: FeedbackService,
    private readonly logger: Logger,
    private readonly repository: InterviewRepository = new InMemoryInterviewRepository(),
  ) {}

  async startInterview(input: StartInterviewInput): Promise<StartInterviewResult> {
    const totalQuestions = Math.min(
      Math.max(input.totalQuestions ?? env.DEFAULT_TOTAL_QUESTIONS, 1),
      20,
    );

    const candidate = this.candidateService.findById(input.candidateId);
    if (!candidate) {
      throw new AppError("CANDIDATE_NOT_FOUND", `Candidate '${input.candidateId}' was not found.`, 404);
    }

    const curriculum = this.curriculumService.findById(input.curriculumId);
    if (!curriculum) {
      throw new AppError("CURRICULUM_NOT_FOUND", `Curriculum '${input.curriculumId}' was not found.`, 404);
    }

    const session: InterviewSession = {
      id: generateId("interview"),
      candidate,
      curriculum,
      status: "CREATED",
      currentQuestion: null,
      currentTopic: "",
      currentDifficulty: "easy",
      questionNumber: 0,
      totalQuestions,
      questions: [],
      history: [],
      feedback: null,
      error: null,
      coveredTopics: [],
      topicScores: {},
      conceptsAsked: [],
      startedAt: new Date(),
      endedAt: null,
    };

    this.logger.info("interview created", { interviewId: session.id, candidate: candidate.id });

    try {
      const question = await this.generateQuestion(session, "first");
      session.status = "WAITING_FOR_ANSWER";
      await this.repository.save(session);
      this.logger.info("first question generated", { interviewId: session.id });
      return { interview: this.toPublic(session), question };
    } catch (err) {
      session.status = "FAILED";
      session.error = toError(err);
      await this.safeSave(session);
      throw err;
    }
  }

  async submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
    this.acquireLock(input.interviewId);
    try {
      return await this.doSubmitAnswer(input);
    } finally {
      this.releaseLock(input.interviewId);
    }
  }

  private async doSubmitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
    const session = await this.getSessionOrThrow(input.interviewId);

    if (session.status === "COMPLETED") {
      throw new AppError("INTERVIEW_ALREADY_COMPLETED", "This interview has already been completed.", 409);
    }
    if (session.status === "ENDED") {
      throw new AppError("INTERVIEW_ALREADY_ENDED", "This interview has already been ended.", 409);
    }
    if (session.status === "FAILED") {
      throw new AppError("INTERVIEW_FAILED", "This interview has failed.", 409);
    }
    if (session.status !== "WAITING_FOR_ANSWER") {
      throw new AppError(
        "INVALID_INTERVIEW_STATE",
        `The interview is in state '${session.status}' and cannot accept an answer right now.`,
        409,
      );
    }

    const answer = input.answer.trim();
    if (!answer) {
      throw new AppError("EMPTY_ANSWER", "Answer cannot be empty.", 400);
    }
    if (answer.length > env.MAX_ANSWER_LENGTH) {
      throw new AppError(
        "ANSWER_TOO_LONG",
        `Answer exceeds the maximum length of ${env.MAX_ANSWER_LENGTH} characters.`,
        400,
      );
    }
    if (!session.currentQuestion) {
      throw new AppError("NO_ACTIVE_QUESTION", "There is no active question to answer.", 409);
    }

    const question = session.currentQuestion;
    session.history.push({ role: "candidate", answer });
    session.status = "EVALUATING";
    this.logger.info("answer submitted", { interviewId: session.id, questionId: question.id });

    let evaluation: Evaluation;
    try {
      const context: EvaluateAnswerContext = {
        candidate: session.candidate,
        curriculum: session.curriculum,
        question,
        answer,
        difficulty: session.currentDifficulty,
        previousEvaluations: getEvaluations(session),
      };
      evaluation = await this.aiService.evaluateAnswer(context);
    } catch (err) {
      session.history.pop();
      session.status = "WAITING_FOR_ANSWER";
      this.logger.error("evaluation failed", { interviewId: session.id, questionId: question.id });
      throw err;
    }

    session.history.push({ role: "evaluation", evaluation });
    this.trackTopicScore(session, question.topic, evaluation.score);
    session.status = "GENERATING_NEXT_QUESTION";
    this.logger.info("evaluation completed", { interviewId: session.id, score: evaluation.score });

    if (session.questionNumber >= session.totalQuestions) {
      const feedback = await this.completeInterview(session);
      return {
        completed: true,
        interviewId: session.id,
        questionNumber: session.questionNumber,
        evaluation: scaleEvaluation(evaluation),
        feedback,
      };
    }

    try {
      const nextQuestion = await this.generateQuestion(session, "follow_up");
      session.status = "WAITING_FOR_ANSWER";
      await this.repository.save(session);
      this.logger.info("next question generated", { interviewId: session.id });
      return {
        completed: false,
        interviewId: session.id,
        questionNumber: session.questionNumber,
        evaluation: scaleEvaluation(evaluation),
        question: nextQuestion,
      };
    } catch (err) {
      session.status = "FAILED";
      session.error = toError(err);
      await this.safeSave(session);
      throw err;
    }
  }

  async endInterview(interviewId: string): Promise<{ completed: true; feedback: InterviewFeedback }> {
    this.acquireLock(interviewId);
    try {
      return await this.doEndInterview(interviewId);
    } finally {
      this.releaseLock(interviewId);
    }
  }

  private async doEndInterview(interviewId: string): Promise<{ completed: true; feedback: InterviewFeedback }> {
    const session = await this.getSessionOrThrow(interviewId);

    if (session.status === "COMPLETED" || session.status === "ENDED") {
      return { completed: true, feedback: session.feedback! };
    }
    if (session.status === "FAILED") {
      throw new AppError("INTERVIEW_FAILED", "This interview has failed.", 409);
    }

    const feedback = await this.completeInterview(session, "COMPLETED");
    this.logger.info("interview ended manually", { interviewId: session.id });
    return { completed: true, feedback };
  }

  async getInterview(interviewId: string): Promise<PublicInterview> {
    return this.toPublic(await this.getSessionOrThrow(interviewId));
  }

  async getFeedback(interviewId: string): Promise<InterviewFeedback> {
    const session = await this.getSessionOrThrow(interviewId);
    if (session.status !== "COMPLETED") {
      throw new AppError(
        "INTERVIEW_NOT_COMPLETED",
        "Feedback is only available after the interview is completed.",
        409,
      );
    }
    return session.feedback!;
  }

  private async generateQuestion(session: InterviewSession, type: QuestionType): Promise<Question> {
    session.status = "GENERATING_NEXT_QUESTION";

    const { topicName, conceptId } = this.curriculumService.getNextTopic(session.curriculum, session);
    const previousTurn = getPreviousTurn(session);

    const difficulty: Difficulty =
      type === "first"
        ? "easy"
        : determineDifficulty(lastEvaluation(session)?.score ?? 60, session.currentDifficulty);

    const context: GenerateQuestionContext = {
      candidate: session.candidate,
      curriculum: session.curriculum,
      topicName,
      conceptHint: conceptId ?? undefined,
      difficulty,
      questionNumber: session.questionNumber + 1,
      totalQuestions: session.totalQuestions,
      previousTurn,
      questionsAsked: session.questions,
      coveredTopics: session.coveredTopics,
      topicScores: this.topicScoreAverages(session),
    };

    const ai = await this.aiService.generateQuestion(context);

    const question: Question = {
      id: generateId("q"),
      text: ai.question,
      topic: topicName,
      difficulty,
      type,
    };

    session.questionNumber += 1;
    session.currentTopic = topicName;
    session.currentDifficulty = difficulty;
    session.questions.push(question);
    session.currentQuestion = question;
    session.history.push({ role: "interviewer", question });

    if (!session.coveredTopics.includes(topicName)) {
      session.coveredTopics.push(topicName);
    }
    if (conceptId && !session.conceptsAsked.includes(conceptId)) {
      session.conceptsAsked.push(conceptId);
    }

    return question;
  }

  private async completeInterview(
    session: InterviewSession,
    status: "COMPLETED" | "ENDED" = "COMPLETED",
  ): Promise<InterviewFeedback> {
    try {
      const feedback = await this.feedbackService.generate(session);
      session.feedback = feedback;
      session.status = status;
      session.endedAt = new Date();
      await this.repository.save(session);
      this.logger.info("interview completed", {
        interviewId: session.id,
        status,
        overallScore: feedback.overallScore,
      });
      return feedback;
    } catch (err) {
      session.status = "FAILED";
      session.error = toError(err);
      await this.safeSave(session);
      this.logger.error("failed to generate final feedback", { interviewId: session.id });
      throw err;
    }
  }

  private trackTopicScore(session: InterviewSession, topic: string, score: number): void {
    const current = session.topicScores[topic] ?? [];
    current.push(score);
    session.topicScores[topic] = current;
  }

  private topicScoreAverages(session: InterviewSession): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [topic, scores] of Object.entries(session.topicScores)) {
      if (scores.length > 0) {
        out[topic] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }
    return out;
  }

  private async getSessionOrThrow(interviewId: string): Promise<InterviewSession> {
    const session = await this.repository.findById(interviewId);
    if (!session) {
      throw new AppError("INTERVIEW_NOT_FOUND", `Interview '${interviewId}' was not found.`, 404);
    }
    return session;
  }

  private async safeSave(session: InterviewSession): Promise<void> {
    try {
      await this.repository.save(session);
    } catch (err) {
      this.logger.error("failed to persist interview state", { interviewId: session.id });
    }
  }

  private acquireLock(interviewId: string): void {
    if (this.inFlight.has(interviewId)) {
      throw new AppError(
        "INVALID_INTERVIEW_STATE",
        "The interview is already processing an answer.",
        409,
      );
    }
    this.inFlight.add(interviewId);
  }

  private releaseLock(interviewId: string): void {
    this.inFlight.delete(interviewId);
  }

  private toPublic(session: InterviewSession): PublicInterview {
    return {
      id: session.id,
      candidate: {
        id: session.candidate.id,
        name: session.candidate.name,
        experience: session.candidate.experience,
        skills: session.candidate.skills,
      },
      curriculum: {
        id: session.curriculum.id,
        title: session.curriculum.title,
      },
      status: session.status,
      currentQuestion: session.currentQuestion,
      questionNumber: session.questionNumber,
      totalQuestions: session.totalQuestions,
      currentTopic: session.currentTopic,
      currentDifficulty: session.currentDifficulty,
      questions: session.questions,
      history: session.history.filter(
        (turn) => turn.role === "interviewer" || turn.role === "candidate",
      ),
      feedback: session.feedback,
      error: session.error,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    };
  }
}

function toError(err: unknown): { code: string; message: string } {
  if (err instanceof AppError) {
    return { code: err.code, message: err.message };
  }
  return { code: "INTERNAL_ERROR", message: "Internal server error" };
}

function scaleEvaluation(evaluation: Evaluation): Evaluation {
  return {
    ...evaluation,
    correctness: evaluation.correctness <= 1.0 ? Math.round(evaluation.correctness * 100) : evaluation.correctness,
    conceptUnderstanding: evaluation.conceptUnderstanding <= 1.0 ? Math.round(evaluation.conceptUnderstanding * 100) : evaluation.conceptUnderstanding,
    communication: evaluation.communication <= 1.0 ? Math.round(evaluation.communication * 100) : evaluation.communication,
  };
}
