import { logger } from "../utils/logger";
import { env } from "../config/env";
import { candidateService } from "./candidate.service";
import { curriculumService } from "./curriculum.service";
import { aiService } from "./ai.service";
import { FeedbackService } from "./feedback.service";
import { InterviewService } from "./interview.service";
import { InMemoryInterviewRepository } from "../repositories/interview.repository";
import { MongoInterviewRepository } from "../repositories/mongo.interview.repository";

const feedbackService = new FeedbackService(aiService, logger);

const repository = env.MONGODB_URI
  ? new MongoInterviewRepository(candidateService, curriculumService)
  : new InMemoryInterviewRepository();

if (env.MONGODB_URI) {
  logger.info("Using MongoDB repository for interview state.");
} else {
  logger.warn(
    "MONGODB_URI not set - using in-memory repository (interviews are lost on restart/sleep).",
  );
}

export const interviewService = new InterviewService(
  candidateService,
  curriculumService,
  aiService,
  feedbackService,
  logger,
  repository,
);

export { aiService, candidateService, curriculumService };
