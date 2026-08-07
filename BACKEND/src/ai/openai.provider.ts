import type {
  AIEvaluationResponse,
  AIFeedbackResponse,
  AIProvider,
  AIQuestionResponse,
  EvaluateAnswerContext,
  FinalFeedbackContext,
  GenerateQuestionContext,
} from "./ai.provider";
import { parseJson } from "./response.parser";
import {
  buildEvaluationMessages,
  buildFeedbackMessages,
  buildQuestionMessages,
  ChatMessage,
} from "./prompt.builder";
import { AppError } from "../utils/errors";
import type { Logger } from "../utils/logger";

export interface OpenAIProviderOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(
    private readonly opts: OpenAIProviderOptions,
    private readonly logger: Logger,
  ) {}

  async generateQuestion(context: GenerateQuestionContext): Promise<AIQuestionResponse> {
    return this.structured(buildQuestionMessages(context));
  }

  async evaluateAnswer(context: EvaluateAnswerContext): Promise<AIEvaluationResponse> {
    return this.structured(buildEvaluationMessages(context));
  }

  async generateFinalFeedback(context: FinalFeedbackContext): Promise<AIFeedbackResponse> {
    return this.structured(buildFeedbackMessages(context));
  }

  private async structured<T>(messages: ChatMessage[]): Promise<T> {
    const text = await this.complete(messages);
    let parsed: unknown;
    try {
      parsed = parseJson(text);
    } catch {
      throw new AppError(
        "AI_MALFORMED_RESPONSE",
        "The AI provider returned a response that is not valid JSON.",
        502,
      );
    }
    return parsed as T;
  }

  private async complete(messages: ChatMessage[]): Promise<string> {
    const url = `${this.opts.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opts.model,
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(this.opts.timeoutMs),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error("AI provider request failed", { status: res.status });
      throw new AppError(
        "AI_PROVIDER_FAILURE",
        `The AI provider returned an error (status ${res.status}).`,
        502,
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      throw new AppError(
        "AI_MALFORMED_RESPONSE",
        "The AI provider returned an empty response.",
        502,
      );
    }
    return content;
  }
}
