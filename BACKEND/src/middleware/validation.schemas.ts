import { z } from "zod";

export const startInterviewSchema = z.object({
  candidateId: z.string().min(1, "candidateId is required"),
  curriculumId: z.string().min(1, "curriculumId is required"),
  totalQuestions: z.number().int().min(1).max(20).optional(),
});

export const answerSchema = z.object({
  answer: z
    .string({ required_error: "answer is required" })
    .trim()
    .min(1, "answer cannot be empty")
    .max(4000, "answer is too long"),
});

export const socketAnswerSchema = answerSchema.extend({
  interviewId: z.string().min(1, "interviewId is required"),
});

export const socketEndSchema = z.object({
  interviewId: z.string().min(1, "interviewId is required"),
});

export const interviewIdParamSchema = z.object({
  id: z.string().min(1),
});
