import type { Server, Socket } from "socket.io";
import type { InterviewService } from "../services/interview.service";
import { socketAnswerSchema, socketEndSchema, startInterviewSchema } from "../middleware/validation.schemas";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

type Ack = (error: { code: string; message: string } | null, data?: unknown) => void;

function toClientError(err: unknown): { code: string; message: string } {
  if (err instanceof AppError) {
    return { code: err.code, message: err.message };
  }
  logger.error("socket error", { error: err instanceof Error ? err.message : String(err) });
  return { code: "INTERNAL_ERROR", message: "Internal server error" };
}

export function registerInterviewSocket(io: Server, interviewService: InterviewService): void {
  io.on("connection", (socket: Socket) => {
    socket.on("interview:start", async (payload: unknown, ack?: Ack) => {
      try {
        const input = startInterviewSchema.parse(payload);
        const result = await interviewService.startInterview(input);

        socket.join(`interview:${result.interview.id}`);
        const data = {
          interviewId: result.interview.id,
          question: result.question,
          questionNumber: result.interview.questionNumber,
          totalQuestions: result.interview.totalQuestions,
          topic: result.question.topic,
          difficulty: result.question.difficulty,
        };
        socket.emit("interview:question", data);
        ack?.(null, data);
      } catch (err) {
        const error = toClientError(err);
        socket.emit("interview:error", error);
        ack?.(error);
      }
    });

    socket.on("interview:answer", async (payload: unknown, ack?: Ack) => {
      try {
        const body = socketAnswerSchema.parse(payload);
        const result = await interviewService.submitAnswer({
          interviewId: body.interviewId,
          answer: body.answer,
        });

        socket.emit("interview:evaluation", {
          interviewId: result.interviewId,
          evaluation: result.evaluation,
          questionNumber: result.questionNumber,
        });

        if (result.completed) {
          socket.emit("interview:completed", {
            interviewId: result.interviewId,
            feedback: result.feedback,
          });
        } else {
          const data = {
            interviewId: result.interviewId,
            question: result.question,
            questionNumber: result.questionNumber,
            topic: result.question.topic,
            difficulty: result.question.difficulty,
          };
          socket.emit("interview:next-question", data);
        }
        ack?.(null);
      } catch (err) {
        const error = toClientError(err);
        socket.emit("interview:error", error);
        ack?.(error);
      }
    });

    socket.on("interview:end", async (payload: unknown, ack?: Ack) => {
      try {
        const body = socketEndSchema.parse(payload);
        const result = await interviewService.endInterview(body.interviewId);
        socket.emit("interview:completed", {
          interviewId: body.interviewId,
          feedback: result.feedback,
        });
        ack?.(null);
      } catch (err) {
        const error = toClientError(err);
        socket.emit("interview:error", error);
        ack?.(error);
      }
    });
  });
}
