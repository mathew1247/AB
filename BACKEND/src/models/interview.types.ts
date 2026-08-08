import type { Candidate } from "./candidate.types";
import type { Curriculum } from "./curriculum.types";
import type { Difficulty, Evaluation } from "./evaluation.types";
import type { InterviewFeedback } from "./feedback.types";

export type QuestionType = "first" | "follow_up";

export type InterviewStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_ANSWER"
  | "EVALUATING"
  | "GENERATING_NEXT_QUESTION"
  | "COMPLETED"
  | "ENDED"
  | "FAILED";

export interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
}

export type ConversationTurn =
  | { role: "interviewer"; question: Question }
  | { role: "candidate"; answer: string }
  | { role: "evaluation"; evaluation: Evaluation };

export interface InterviewSession {
  id: string;
  candidate: Candidate;
  curriculum: Curriculum;
  status: InterviewStatus;
  currentQuestion: Question | null;
  currentTopic: string;
  currentDifficulty: Difficulty;
  questionNumber: number;
  totalQuestions: number;
  questions: Question[];
  history: ConversationTurn[];
  feedback: InterviewFeedback | null;
  error: { code: string; message: string } | null;
  coveredTopics: string[];
  topicScores: Record<string, number[]>;
  conceptsAsked: string[];
  startedAt: Date;
  endedAt: Date | null;
}
