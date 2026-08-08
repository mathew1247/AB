import type { InterviewSession } from "../models/interview.types";
import { InterviewModel } from "../models/interview.model";
import type { InterviewRepository } from "./interview.repository";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import type { CandidateService } from "../services/candidate.service";
import type { CurriculumService } from "../services/curriculum.service";

/**
 * Production repository backed by MongoDB Atlas.
 * Stores interview state and rehydrates candidate/curriculum from the JSON
 * data services on load.
 */
export class MongoInterviewRepository implements InterviewRepository {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly curriculumService: CurriculumService,
  ) {}

  async save(session: InterviewSession): Promise<void> {
    await ensureDatabase();

    const doc = {
      _id: session.id,
      candidateId: session.candidate.id,
      curriculumId: session.curriculum.id,
      status: session.status,
      currentQuestion: session.currentQuestion ?? null,
      currentTopic: session.currentTopic,
      currentDifficulty: session.currentDifficulty,
      questionNumber: session.questionNumber,
      totalQuestions: session.totalQuestions,
      questions: session.questions,
      history: session.history,
      coveredTopics: session.coveredTopics,
      topicScores: session.topicScores,
      conceptsAsked: session.conceptsAsked,
      feedback: session.feedback ?? null,
      error: session.error,
      startedAt: session.startedAt,
      endedAt: session.endedAt ?? null,
    };

    await InterviewModel.findOneAndUpdate({ _id: session.id }, { $set: doc }, { upsert: true }).exec();
  }

  async findById(id: string): Promise<InterviewSession | null> {
    await ensureDatabase();

    const doc = await InterviewModel.findById(id).lean().exec();
    if (!doc) {
      return null;
    }

    const candidate = this.candidateService.findById(doc.candidateId);
    const curriculum = this.curriculumService.findById(doc.curriculumId);
    if (!candidate || !curriculum) {
      return null;
    }

    return {
      id: doc._id,
      candidate,
      curriculum,
      status: doc.status as InterviewSession["status"],
      currentQuestion: (doc.currentQuestion as unknown as InterviewSession["currentQuestion"]) ?? null,
      currentTopic: doc.currentTopic,
      currentDifficulty: doc.currentDifficulty as InterviewSession["currentDifficulty"],
      questionNumber: doc.questionNumber,
      totalQuestions: doc.totalQuestions,
      questions: (doc.questions as unknown as InterviewSession["questions"]) ?? [],
      history: (doc.history as unknown as InterviewSession["history"]) ?? [],
      feedback: (doc.feedback as unknown as InterviewSession["feedback"]) ?? null,
      error: doc.error ?? null,
      coveredTopics: doc.coveredTopics ?? [],
      topicScores: doc.topicScores ?? {},
      conceptsAsked: doc.conceptsAsked ?? [],
      startedAt: new Date(doc.startedAt),
      endedAt: doc.endedAt ? new Date(doc.endedAt) : null,
    };
  }
}

async function ensureDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    throw new AppError("DATABASE_NOT_CONFIGURED", "MongoDB is not configured.", 503);
  }
  try {
    await connectDatabase();
  } catch {
    throw new AppError(
      "DATABASE_UNAVAILABLE",
      "MongoDB is configured but currently unavailable.",
      503,
    );
  }
}
