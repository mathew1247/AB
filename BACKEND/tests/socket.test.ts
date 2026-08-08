import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { io as ioClient, type Socket } from "socket.io-client";
import type { AddressInfo } from "node:net";
import { createServerInstance, type ServerInstance } from "../src/app-server";
import type { Difficulty } from "../src/models/evaluation.types";

interface QuestionPayload {
  interviewId: string;
  question: { id: string; text: string; topic: string; difficulty: Difficulty; type: string };
  questionNumber: number;
  totalQuestions: number;
}

interface EvaluationPayload {
  interviewId: string;
  evaluation: { score: number };
  questionNumber: number;
}

interface ErrorPayload {
  code: string;
  message: string;
}

let server: ServerInstance;
let baseUrl: string;

beforeEach(async () => {
  server = createServerInstance();
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  const { port } = server.httpServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => {
    server.io.close(() => server.httpServer.close(() => resolve()));
  });
});

function connect(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const client = ioClient(baseUrl, { transports: ["websocket"], forceNew: true });
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
  });
}

function once<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, (data: T) => resolve(data)));
}

function emitWithAck(socket: Socket, event: string, payload: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout for '${event}'`)), 5000);
    socket.emit(event, payload, (...args: unknown[]) => {
      clearTimeout(timer);
      const error = args[0] ?? null;
      const data = args[1];
      resolve({ error, data });
    });
  });
}

const STRONG_ANSWER =
  "Inheritance lets a child class extend a parent class using the extends keyword. The child class reuses and overrides the parent class methods.";

describe("Socket.IO interview flow", () => {
  it("runs a full interview over sockets: start -> question -> answer -> evaluation -> completed", async () => {
    const client = await connect();

    const questionP = once<QuestionPayload>(client, "interview:question");
    const startAck = (await emitWithAck(client, "interview:start", {
      candidateId: "cand-1",
      curriculumId: "java-core",
      totalQuestions: 1,
    })) as { error: ErrorPayload | null; data: QuestionPayload } | ErrorPayload;

    expect((startAck as { error: ErrorPayload | null }).error).toBeNull();

    const question = await questionP;
    expect(question.question.type).toBe("first");
    expect(question.questionNumber).toBe(1);
    expect(question.totalQuestions).toBe(1);

    const evaluationP = once<EvaluationPayload>(client, "interview:evaluation");
    const completedP = once<{ interviewId: string; feedback: { overallScore: number } }>(client, "interview:completed");
    const answerAck = (await emitWithAck(client, "interview:answer", {
      interviewId: question.interviewId,
      answer: STRONG_ANSWER,
    })) as { error: ErrorPayload | null };

    expect(answerAck.error).toBeNull();

    const evaluation = await evaluationP;
    expect(evaluation.evaluation.score).toBeGreaterThanOrEqual(0);
    expect(evaluation.questionNumber).toBe(1);

    const completed = await completedP;
    expect(completed.feedback.overallScore).toBeGreaterThanOrEqual(0);
    client.disconnect();
  });

  it("emits a context-aware follow-up question", async () => {
    const client = await connect();

    const questionP = once<QuestionPayload>(client, "interview:question");
    await emitWithAck(client, "interview:start", {
      candidateId: "cand-1",
      curriculumId: "java-core",
      totalQuestions: 2,
    });
    const first = await questionP;

    const evaluationP = once<EvaluationPayload>(client, "interview:evaluation");
    const nextP = once<QuestionPayload>(client, "interview:next-question");
    await emitWithAck(client, "interview:answer", {
      interviewId: first.interviewId,
      answer: STRONG_ANSWER,
    });

    await evaluationP;
    const next = await nextP;
    expect(next.question.type).toBe("follow_up");
    expect(next.questionNumber).toBe(2);
    client.disconnect();
  });

  it("reports a validation error for invalid input", async () => {
    const client = await connect();

    const errorP = once<ErrorPayload>(client, "interview:error");
    const ack = (await emitWithAck(client, "interview:start", {})) as { error: ErrorPayload; data?: unknown };

    expect(ack.error.code).toBe("VALIDATION_ERROR");
    const socketError = await errorP;
    expect(socketError.code).toBe("VALIDATION_ERROR");
    client.disconnect();
  });

  it("rejects answering a non-existent interview", async () => {
    const client = await connect();

    const errorP = once<ErrorPayload>(client, "interview:error");
    const ack = (await emitWithAck(client, "interview:answer", {
      interviewId: "nope",
      answer: "hello",
    })) as { error: ErrorPayload };

    expect(ack.error.code).toBe("INTERVIEW_NOT_FOUND");
    const socketError = await errorP;
    expect(socketError.code).toBe("INTERVIEW_NOT_FOUND");
    client.disconnect();
  });
});
