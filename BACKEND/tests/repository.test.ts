import { describe, expect, it } from "vitest";
import { InterviewService } from "../src/services/interview.service";
import { AIService } from "../src/services/ai.service";
import { FeedbackService } from "../src/services/feedback.service";
import { candidateService } from "../src/services/candidate.service";
import { curriculumService } from "../src/services/curriculum.service";
import { InMemoryInterviewRepository } from "../src/repositories/interview.repository";
import type { AIProvider, GenerateQuestionContext } from "../src/ai/ai.provider";
import { logger } from "../src/utils/logger";

function createService(repository: InMemoryInterviewRepository): InterviewService {
  const ai = new AIService(logger, new MockProviderInstance());
  const feedback = new FeedbackService(ai, logger);
  return new InterviewService(candidateService, curriculumService, ai, feedback, logger, repository);
}

describe("interview repository (persistence)", () => {
  it("survives a service restart when the repository is shared", async () => {
    const repository = new InMemoryInterviewRepository();

    const first = createService(repository);
    const { interview } = await first.startInterview({
      candidateId: "cand-1",
      curriculumId: "java-core",
      totalQuestions: 2,
    });

    const result = await first.submitAnswer({
      interviewId: interview.id,
      answer: "Inheritance lets a child class extend a parent class using the extends keyword.",
    });
    expect(result.completed).toBe(false);

    // Simulate a restart: a brand-new service instance backed by the same repository.
    const second = createService(repository);
    const restored = await second.getInterview(interview.id);

    expect(restored.id).toBe(interview.id);
    expect(restored.questionNumber).toBe(2);
    expect(restored.questions).toHaveLength(2);
    expect(restored.history.length).toBeGreaterThan(0);
    expect(restored.currentDifficulty).toBe("medium");
  });

  it("reports INTERVIEW_NOT_FOUND for unknown ids", async () => {
    const repository = new InMemoryInterviewRepository();
    const svc = createService(repository);

    await expect(svc.getInterview("nope")).rejects.toMatchObject({
      code: "INTERVIEW_NOT_FOUND",
    });
  });
});

class MockProviderInstance implements AIProvider {
  readonly name = "mock-repo-test";
  async generateQuestion(context: GenerateQuestionContext) {
    if (context.previousTurn) {
      return {
        question: "Follow-up question.",
        topic: "OOP",
        difficulty: "medium" as const,
        questionType: "follow_up" as const,
        reason: "follow-up",
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
      missingConcepts: [],
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
