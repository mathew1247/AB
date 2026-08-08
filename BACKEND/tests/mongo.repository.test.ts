import { describe, expect, it, vi, beforeEach } from "vitest";
import { candidateService } from "../src/services/candidate.service";
import { curriculumService } from "../src/services/curriculum.service";
import type { InterviewSession } from "../src/models/interview.types";

/**
 * Unit tests for the MongoDB repository mapping logic (session <-> document).
 * The Mongoose model and DB connection are mocked so tests run offline and
 * never touch the real cluster.
 */
const mocks = vi.hoisted(() => {
  const store = new Map<string, Record<string, unknown>>();
  return {
    store,
    InterviewModel: {
      findOneAndUpdate: (filter: { _id: string }, update: { $set: Record<string, unknown> }) => ({
        exec: async () => {
          store.set(filter._id, update.$set);
        },
      }),
      findById: (id: string) => ({
        lean: () => ({
          exec: async () => store.get(id) ?? null,
        }),
      }),
    },
  };
});

vi.mock("../src/models/interview.model", () => ({ InterviewModel: mocks.InterviewModel }));
vi.mock("../src/config/database", () => ({ connectDatabase: async () => ({}) }));
vi.mock("../src/config/env", () => ({ env: { MONGODB_URI: "mongodb://fake:27017/test" } }));

import { MongoInterviewRepository } from "../src/repositories/mongo.interview.repository";

function makeSession(overrides: Partial<InterviewSession> = {}): InterviewSession {
  const candidate = candidateService.findById("cand-1")!;
  const curriculum = curriculumService.findById("java-core")!;
  return {
    id: "interview_roundtrip",
    candidate,
    curriculum,
    status: "WAITING_FOR_ANSWER",
    currentQuestion: {
      id: "q_1",
      text: "Explain inheritance in Java.",
      topic: "OOP",
      difficulty: "easy",
      type: "first",
    },
    currentTopic: "OOP",
    currentDifficulty: "easy",
    questionNumber: 1,
    totalQuestions: 3,
    questions: [],
    history: [
      { role: "interviewer", question: { id: "q_1", text: "Explain inheritance in Java.", topic: "OOP", difficulty: "easy", type: "first" } },
      { role: "candidate", answer: "A class can extend another class." },
    ],
    feedback: null,
    error: null,
    coveredTopics: ["OOP"],
    topicScores: {},
    conceptsAsked: ["inheritance"],
    startedAt: new Date("2026-01-01T00:00:00.000Z"),
    endedAt: null,
    ...overrides,
  };
}

describe("MongoInterviewRepository", () => {
  beforeEach(() => {
    mocks.store.clear();
  });

  it("saves and rehydrates an interview session", async () => {
    const repo = new MongoInterviewRepository(candidateService, curriculumService);
    const session = makeSession();

    await repo.save(session);
    const restored = await repo.findById(session.id);

    expect(restored).not.toBeNull();
    expect(restored!.id).toBe(session.id);
    expect(restored!.status).toBe("WAITING_FOR_ANSWER");
    expect(restored!.candidate.id).toBe("cand-1");
    expect(restored!.curriculum.id).toBe("java-core");
    expect(restored!.questionNumber).toBe(1);
    expect(restored!.totalQuestions).toBe(3);
    expect(restored!.currentTopic).toBe("OOP");
    expect(restored!.currentDifficulty).toBe("easy");
    expect(restored!.coveredTopics).toEqual(["OOP"]);
    expect(restored!.conceptsAsked).toEqual(["inheritance"]);
    expect(restored!.questions).toEqual(session.questions);
    expect(restored!.history).toHaveLength(2);
    expect(restored!.currentQuestion?.text).toBe("Explain inheritance in Java.");
    expect(restored!.startedAt).toEqual(session.startedAt);
  });

  it("preserves completion state and feedback", async () => {
    const repo = new MongoInterviewRepository(candidateService, curriculumService);
    const session = makeSession({
      status: "COMPLETED",
      currentQuestion: null,
      feedback: {
        overallScore: 85,
        technicalScore: 85,
        communicationScore: 80,
        strengths: ["Solid understanding of OOP"],
        weaknesses: [],
        topicScores: {},
        recommendations: ["Practice inheritance"],
        summary: "Good performance.",
      },
      endedAt: new Date("2026-01-01T01:00:00.000Z"),
    });

    await repo.save(session);
    const restored = await repo.findById(session.id);

    expect(restored!.status).toBe("COMPLETED");
    expect(restored!.currentQuestion).toBeNull();
    expect(restored!.feedback?.overallScore).toBe(85);
    expect(restored!.endedAt).toEqual(session.endedAt);
  });

  it("returns null for an unknown id", async () => {
    const repo = new MongoInterviewRepository(candidateService, curriculumService);
    expect(await repo.findById("nope")).toBeNull();
  });
});
