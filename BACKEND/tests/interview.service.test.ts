import { describe, expect, it } from "vitest";
import { InterviewService } from "../src/services/interview.service";
import { AIService } from "../src/services/ai.service";
import { FeedbackService } from "../src/services/feedback.service";
import { candidateService } from "../src/services/candidate.service";
import { curriculumService } from "../src/services/curriculum.service";
import type { AIProvider, GenerateQuestionContext } from "../src/ai/ai.provider";
import { AppError } from "../src/utils/errors";
import { logger } from "../src/utils/logger";

function createInterviewService(provider: AIProvider): InterviewService {
  const ai = new AIService(logger, provider);
  const feedback = new FeedbackService(ai, logger);
  return new InterviewService(candidateService, curriculumService, ai, feedback, logger);
}

function newSession(interviewService: InterviewService, totalQuestions = 3) {
  return interviewService.startInterview({
    candidateId: "cand-1",
    curriculumId: "java-core",
    totalQuestions,
  });
}

const STRONG_ANSWER =
  "Inheritance lets a child class extend a parent class using the extends keyword. The child class reuses and overrides the parent class methods and can call the parent constructor with super.";

const WEAK_ANSWER = "I don't know.";

describe("interview service (mock provider)", () => {
  it("creates an interview and generates the first question", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview, question } = await newSession(svc);

    expect(interview.status).toBe("WAITING_FOR_ANSWER");
    expect(interview.questionNumber).toBe(1);
    expect(question.type).toBe("first");
    expect(question.text.length).toBeGreaterThan(0);
  });

  it("submits an answer and generates a context-aware follow-up question", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview } = await newSession(svc);

    const result = await svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER });

    expect(result.completed).toBe(false);
    if (result.completed) return;
    expect(result.evaluation.score).toBeGreaterThanOrEqual(60);
    expect(result.question.type).toBe("follow_up");
    // follow-up must reference the candidate's own words
    expect(result.question.text).toContain("You said");
  });

  it("adapts difficulty upward after a strong answer", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview } = await newSession(svc, 3);

    await svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER });
    const state = await svc.getInterview(interview.id);

    expect(state.currentDifficulty).toBe("medium");
  });

  it("completes the interview with structured feedback", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview } = await newSession(svc, 2);

    const first = await svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER });
    expect(first.completed).toBe(false);
    const second = await svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER });

    expect(second.completed).toBe(true);
    if (!second.completed) return;
    expect(second.feedback.overallScore).toBeGreaterThanOrEqual(0);
    expect(second.feedback.overallScore).toBeLessThanOrEqual(100);
    expect(second.feedback.summary.length).toBeGreaterThan(0);
    expect(second.feedback.recommendations).toBeInstanceOf(Array);

    const state = await svc.getInterview(interview.id);
    expect(state.status).toBe("COMPLETED");
    expect(state.endedAt).not.toBeNull();

    const feedback = await svc.getFeedback(interview.id);
    expect(feedback).toEqual(second.feedback);
  });

  it("rejects answering an unknown interview id", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    await expect(
      svc.submitAnswer({ interviewId: "nope", answer: "hi" }),
    ).rejects.toMatchObject({ code: "INTERVIEW_NOT_FOUND" });
  });

  it("rejects an empty answer", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview } = await newSession(svc);
    await expect(
      svc.submitAnswer({ interviewId: interview.id, answer: "   " }),
    ).rejects.toMatchObject({ code: "EMPTY_ANSWER" });
  });

  it("rejects submitting two answers for the same question", async () => {
    const svc = createInterviewService(new SlowProvider(50));
    const { interview } = await newSession(svc);

    const first = svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER });
    await expect(
      svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER }),
    ).rejects.toMatchObject({ code: "INVALID_INTERVIEW_STATE" });

    await first;
  });

  it("rejects answering a completed interview", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview } = await newSession(svc, 1);

    const result = await svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER });
    expect(result.completed).toBe(true);

    await expect(
      svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER }),
    ).rejects.toMatchObject({ code: "INTERVIEW_ALREADY_COMPLETED" });
  });

  it("handles AI failures without corrupting state", async () => {
    const svc = createInterviewService(new FailingProvider());
    const { interview } = await newSession(svc);

    await expect(
      svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER }),
    ).rejects.toMatchObject({ code: "AI_EVALUATION_FAILED" });

    const state = await svc.getInterview(interview.id);
    expect(state.status).toBe("WAITING_FOR_ANSWER");
  });

  it("returns feedback only after completion", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview } = await newSession(svc, 3);

    await expect(
      svc.getFeedback(interview.id),
    ).rejects.toMatchObject({ code: "INTERVIEW_NOT_COMPLETED" });
  });

  it("ends an interview early with feedback", async () => {
    const svc = createInterviewService(new MockProviderInstance());
    const { interview } = await newSession(svc, 5);

    const first = await svc.submitAnswer({ interviewId: interview.id, answer: STRONG_ANSWER });
    expect(first.completed).toBe(false);

    const ended = await svc.endInterview(interview.id);
    expect(ended.feedback.summary.length).toBeGreaterThan(0);
    expect((await svc.getInterview(interview.id)).status).toBe("COMPLETED");
  });
});

class MockProviderInstance implements AIProvider {
  readonly name = "mock-test";
  async generateQuestion(context: GenerateQuestionContext) {
    if (context.previousTurn) {
      return {
        question: `You said "${context.previousTurn.answer.slice(0, 20)}". Can you explain the extends keyword?`,
        topic: "OOP",
        difficulty: "medium" as const,
        questionType: "follow_up" as const,
        reason: "follow-up on previous answer",
      };
    }
    return {
      question: "Explain inheritance in Java.",
      topic: "OOP",
      difficulty: "easy" as const,
      questionType: "first" as const,
      reason: "test",
    };
  }
  async evaluateAnswer() {
    return {
      score: 90,
      correctness: 0.9,
      conceptUnderstanding: 0.9,
      communication: 0.9,
      strengths: ["Understands inheritance"],
      weaknesses: [],
      missingConcepts: ["extends"],
      feedback: "Good.",
    };
  }
  async generateFinalFeedback() {
    return {
      overallScore: 90,
      technicalScore: 90,
      communicationScore: 90,
      strengths: ["Good grasp"],
      weaknesses: [],
      topicScores: {},
      recommendations: ["Practice examples"],
      summary: "Solid performance.",
    };
  }
}

class SlowProvider implements AIProvider {
  readonly name = "slow-test";
  constructor(private readonly delayMs: number) {}
  private async delay() {
    await new Promise((r) => setTimeout(r, this.delayMs));
  }
  async generateQuestion() {
    await this.delay();
    return {
      question: "Explain inheritance in Java.",
      topic: "OOP",
      difficulty: "easy" as const,
      questionType: "first" as const,
      reason: "test",
    };
  }
  async evaluateAnswer() {
    await this.delay();
    return {
      score: 90,
      correctness: 0.9,
      conceptUnderstanding: 0.9,
      communication: 0.9,
      strengths: ["Good"],
      weaknesses: [],
      missingConcepts: [],
      feedback: "Good.",
    };
  }
  async generateFinalFeedback() {
    return {
      overallScore: 90,
      technicalScore: 90,
      communicationScore: 90,
      strengths: [],
      weaknesses: [],
      topicScores: {},
      recommendations: [],
      summary: "OK",
    };
  }
}

class FailingProvider implements AIProvider {
  readonly name = "failing-test";
  async generateQuestion() {
    return {
      question: "Explain inheritance in Java.",
      topic: "OOP",
      difficulty: "easy" as const,
      questionType: "first" as const,
      reason: "test",
    };
  }
  async evaluateAnswer() {
    throw new Error("boom");
  }
  async generateFinalFeedback() {
    throw new Error("boom");
  }
}
