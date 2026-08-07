import type {
  EvaluateAnswerContext,
  FinalFeedbackContext,
  GenerateQuestionContext,
} from "./ai.provider";
import { buildFirstQuestionSystemPrompt, buildFirstQuestionUserPrompt } from "../prompts/question-generation.prompt";
import { buildFollowUpQuestionSystemPrompt, buildFollowUpQuestionUserPrompt } from "../prompts/follow-up-question.prompt";
import { buildEvaluationSystemPrompt, buildEvaluationUserPrompt } from "../prompts/evaluation.prompt";
import { buildFeedbackSystemPrompt, buildFeedbackUserPrompt } from "../prompts/final-feedback.prompt";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export function buildQuestionMessages(context: GenerateQuestionContext): ChatMessage[] {
  if (context.previousTurn) {
    return [
      { role: "system", content: buildFollowUpQuestionSystemPrompt() },
      { role: "user", content: buildFollowUpQuestionUserPrompt(context) },
    ];
  }
  return [
    { role: "system", content: buildFirstQuestionSystemPrompt() },
    { role: "user", content: buildFirstQuestionUserPrompt(context) },
  ];
}

export function buildEvaluationMessages(context: EvaluateAnswerContext): ChatMessage[] {
  return [
    { role: "system", content: buildEvaluationSystemPrompt() },
    { role: "user", content: buildEvaluationUserPrompt(context) },
  ];
}

export function buildFeedbackMessages(context: FinalFeedbackContext): ChatMessage[] {
  return [
    { role: "system", content: buildFeedbackSystemPrompt() },
    { role: "user", content: buildFeedbackUserPrompt(context) },
  ];
}
