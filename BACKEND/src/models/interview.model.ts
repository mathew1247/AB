import { Schema, model, models, type Model } from "mongoose";

/**
 * Mongoose model storing the full interview state so interviews can survive
 * server restarts and continue across Vercel's stateless instances.
 *
 * `history`, `questions`, `feedback`, etc. are stored as Mixed so they map
 * 1:1 to the existing TypeScript types without schema drift.
 */
export interface InterviewDoc {
  _id: string;
  candidateId: string;
  curriculumId: string;
  status: string;
  currentQuestion: unknown;
  currentTopic: string;
  currentDifficulty: string;
  questionNumber: number;
  totalQuestions: number;
  questions: unknown[];
  history: unknown[];
  coveredTopics: string[];
  topicScores: Record<string, number[]>;
  conceptsAsked: string[];
  feedback: unknown;
  error: { code: string; message: string } | null;
  startedAt: Date;
  endedAt: Date | null;
}

const interviewSchema = new Schema<InterviewDoc>({
  _id: { type: String, required: true },
  candidateId: { type: String, required: true },
  curriculumId: { type: String, required: true },
  status: { type: String, required: true },
  currentQuestion: { type: Schema.Types.Mixed, default: null },
  currentTopic: { type: String, default: "" },
  currentDifficulty: { type: String, required: true },
  questionNumber: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  questions: { type: [Schema.Types.Mixed], default: [] },
  history: { type: [Schema.Types.Mixed], default: [] },
  coveredTopics: { type: [String], default: [] },
  topicScores: { type: Schema.Types.Mixed, default: {} },
  conceptsAsked: { type: [String], default: [] },
  feedback: { type: Schema.Types.Mixed, default: null },
  error: { type: Schema.Types.Mixed, default: null },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, default: null },
});

// Reuse the model if it already exists (avoids OverwriteModelError on hot reload).
export const InterviewModel: Model<InterviewDoc> =
  (models.Interview as Model<InterviewDoc> | undefined) ??
  model<InterviewDoc>("Interview", interviewSchema);
