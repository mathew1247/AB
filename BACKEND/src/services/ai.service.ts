import { z } from "zod";
import type {
  AIEvaluationResponse,
  AIFeedbackResponse,
  AIProvider,
  AIQuestionResponse,
  EvaluateAnswerContext,
  FinalFeedbackContext,
  GenerateQuestionContext,
} from "../ai/ai.provider";
import { evaluationResponseSchema, feedbackResponseSchema, questionResponseSchema } from "../ai/ai.provider";
import { OpenAIProvider } from "../ai/openai.provider";
import { MockProvider } from "../ai/mock.provider";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import type { Logger } from "../utils/logger";
import { logger } from "../utils/logger";

export class AIService {
  private readonly provider: AIProvider;

  constructor(logger: Logger, provider?: AIProvider) {
    this.provider = provider ?? selectProvider(logger);
  }

  get providerName(): string {
    return this.provider.name;
  }

  async generateQuestion(context: GenerateQuestionContext): Promise<AIQuestionResponse> {
    try {
      const res = await this.provider.generateQuestion(context);
      return questionResponseSchema.parse(res);
    } catch (err) {
      throw this.mapError(err, "AI_QUESTION_GENERATION_FAILED");
    }
  }

  async evaluateAnswer(context: EvaluateAnswerContext): Promise<AIEvaluationResponse> {
    try {
      const res = await this.provider.evaluateAnswer(context);
      return evaluationResponseSchema.parse(res);
    } catch (err) {
      throw this.mapError(err, "AI_EVALUATION_FAILED");
    }
  }

  async generateFinalFeedback(context: FinalFeedbackContext): Promise<AIFeedbackResponse> {
    try {
      const res = await this.provider.generateFinalFeedback(context);
      return feedbackResponseSchema.parse(res);
    } catch (err) {
      throw this.mapError(err, "AI_FEEDBACK_GENERATION_FAILED");
    }
  }

  private mapError(err: unknown, fallbackCode: string): Error {
    if (err instanceof AppError) {
      return err;
    }
    if (err instanceof z.ZodError) {
      return new AppError(
        "AI_INVALID_RESPONSE",
        "The AI returned a response that does not match the expected structure.",
        502,
      );
    }
    return new AppError(fallbackCode, "The AI provider could not complete the request.", 502);
  }
}

function selectProvider(logger: Logger): AIProvider {
  if (env.AI_PROVIDER === "openai") {
    if (!env.AI_API_KEY) {
      throw new Error("AI_PROVIDER=openai requires AI_API_KEY to be set.");
    }
    logger.info("Using OpenAI-compatible AI provider", { model: env.AI_MODEL });
    return new OpenAIProvider(
      {
        apiKey: env.AI_API_KEY,
        baseUrl: env.AI_BASE_URL,
        model: env.AI_MODEL,
        timeoutMs: env.AI_TIMEOUT_MS,
      },
      logger,
    );
  }

  logger.warn(
    "AI_PROVIDER=mock - using the built-in MOCK provider (no external AI). Set AI_PROVIDER=openai + AI_API_KEY for real AI.",
  );
  return new MockProvider();
}

export const aiService = new AIService(logger);
