import type { FinalFeedbackContext } from "../ai/ai.provider";
import type { InterviewFeedback } from "../models/feedback.types";
import type { InterviewSession } from "../models/interview.types";
import { getAnswers, getEvaluations } from "./history";
import type { AIService } from "./ai.service";
import type { Logger } from "../utils/logger";

export class FeedbackService {
  constructor(
    private readonly ai: AIService,
    private readonly logger: Logger,
  ) {}

  async generate(session: InterviewSession): Promise<InterviewFeedback> {
    const evaluations = getEvaluations(session);

    if (evaluations.length === 0) {
      return {
        overallScore: 0,
        technicalScore: 0,
        communicationScore: 0,
        strengths: [],
        weaknesses: [],
        topicScores: {},
        recommendations: ["Attempt at least one question to receive detailed feedback."],
        summary: "The interview ended before any answers were submitted.",
      };
    }

    const context: FinalFeedbackContext = {
      candidate: session.candidate,
      curriculum: session.curriculum,
      questions: session.questions,
      answers: getAnswers(session),
      evaluations,
      history: session.history,
    };

    const aiResponse = await this.ai.generateFinalFeedback(context);

    return {
      ...aiResponse,
      topicScores: this.computeTopicScores(session),
    };
  }

  private computeTopicScores(session: InterviewSession): Record<string, number> {
    const scores: Record<string, number[]> = {};
    for (let i = 0; i < session.history.length; i++) {
      const turn = session.history[i];
      if (turn.role === "evaluation") {
        const questionTurn = session.history[i - 2];
        const topic =
          questionTurn && questionTurn.role === "interviewer" ? questionTurn.question.topic : "general";
        (scores[topic] ??= []).push(turn.evaluation.score);
      }
    }

    const out: Record<string, number> = {};
    for (const [topic, arr] of Object.entries(scores)) {
      out[topic] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
    return out;
  }
}
