import { logger } from "../utils/logger";
import { candidateService } from "./candidate.service";
import { curriculumService } from "./curriculum.service";
import { aiService } from "./ai.service";
import { FeedbackService } from "./feedback.service";
import { InterviewService } from "./interview.service";

const feedbackService = new FeedbackService(aiService, logger);

export const interviewService = new InterviewService(
  candidateService,
  curriculumService,
  aiService,
  feedbackService,
  logger,
);

export { aiService, candidateService, curriculumService };
