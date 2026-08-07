import { z } from "zod";
import type { Candidate } from "../models/candidate.types";
import type { Curriculum } from "../models/curriculum.types";
import type { Difficulty, Evaluation } from "../models/evaluation.types";
import type { ConversationTurn, Question } from "../models/interview.types";

export const questionResponseSchema = z.object({
  question: z.string().min(1).max(2000),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionType: z.enum(["first", "follow_up"]),
  reason: z.string(),
});

export const evaluationResponseSchema = z.object({
  score: z.number().min(0).max(100),
  correctness: z.number().min(0).max(1),
  conceptUnderstanding: z.number().min(0).max(1),
  communication: z.number().min(0).max(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  feedback: z.string(),
});

export const feedbackResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  technicalScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  topicScores: z.record(z.string(), z.number()),
  recommendations: z.array(z.string()),
  summary: z.string(),
});

export type AIQuestionResponse = z.infer<typeof questionResponseSchema>;
export type AIEvaluationResponse = z.infer<typeof evaluationResponseSchema>;
export type AIFeedbackResponse = z.infer<typeof feedbackResponseSchema>;

export interface PreviousTurn {
  question: Question;
  answer: string;
  evaluation: Evaluation;
}

export interface GenerateQuestionContext {
  candidate: Candidate;
  curriculum: Curriculum;
  topicName: string;
  conceptHint?: string;
  difficulty: Difficulty;
  questionNumber: number;
  totalQuestions: number;
  previousTurn: PreviousTurn | null;
  questionsAsked: Question[];
  coveredTopics: string[];
  topicScores: Record<string, number>;
}

export interface EvaluateAnswerContext {
  candidate: Candidate;
  curriculum: Curriculum;
  question: Question;
  answer: string;
  difficulty: Difficulty;
  previousEvaluations: Evaluation[];
}

export interface FinalFeedbackContext {
  candidate: Candidate;
  curriculum: Curriculum;
  questions: Question[];
  answers: string[];
  evaluations: Evaluation[];
  history: ConversationTurn[];
}

export interface AIProvider {
  readonly name: string;
  generateQuestion(context: GenerateQuestionContext): Promise<AIQuestionResponse>;
  evaluateAnswer(context: EvaluateAnswerContext): Promise<AIEvaluationResponse>;
  generateFinalFeedback(context: FinalFeedbackContext): Promise<AIFeedbackResponse>;
}
