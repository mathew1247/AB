import type {
  AIEvaluationResponse,
  AIFeedbackResponse,
  AIProvider,
  AIQuestionResponse,
  EvaluateAnswerContext,
  FinalFeedbackContext,
  GenerateQuestionContext,
} from "./ai.provider";

/**
 * DEVELOPMENT MOCK PROVIDER.
 *
 * Used when AI_PROVIDER=mock (default) so the backend can be demonstrated and
 * tested end-to-end without any external API key.
 *
 * It is NOT "hardcoded answers pretending to be AI": it still derives
 * follow-up questions from the candidate's previous answer/evaluation and
 * scores answers against the curriculum keywords, so the adaptive behaviour
 * is visible. Swap to the OpenAI provider for real AI by setting AI_PROVIDER=openai.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";

  async generateQuestion(context: GenerateQuestionContext): Promise<AIQuestionResponse> {
    const topic = context.curriculum.topics.find((t) => t.name === context.topicName);
    const concepts = topic?.concepts ?? [];
    const hint = concepts.find((c) => c.id === context.conceptHint);
    const concept = hint ?? concepts[Math.floor(Math.random() * Math.max(concepts.length, 1))];

    if (context.previousTurn) {
      return this.followUp(context, concept);
    }

    return {
      question: `Explain ${concept.name} in ${context.curriculum.title}, and give a practical example.`,
      topic: context.topicName,
      difficulty: context.difficulty,
      questionType: "first",
      reason: `Opening question on the first curriculum topic (${context.topicName}).`,
    };
  }

  private followUp(context: GenerateQuestionContext, concept: { name: string } | undefined): AIQuestionResponse {
    const prev = context.previousTurn!;
    const snippet = truncate(prev.answer, 90);
    const missing = prev.evaluation.missingConcepts[0];

    if (missing) {
      return {
        question: `You said "${snippet}". Earlier you did not mention ${missing}. Can you explain how ${missing} relates to ${prev.question.topic}?`,
        topic: context.topicName,
        difficulty: context.difficulty,
        questionType: "follow_up",
        reason: `Follow-up addressing the missed concept: ${missing}.`,
      };
    }

    if (prev.evaluation.weaknesses.length > 0) {
      return {
        question: `You said "${snippet}". Building on that, can you address: ${prev.evaluation.weaknesses[0]}?`,
        topic: context.topicName,
        difficulty: context.difficulty,
        questionType: "follow_up",
        reason: "Follow-up on an identified weakness in the previous answer.",
      };
    }

    return {
      question: `Good answer. Can you provide a practical example of ${concept?.name ?? "this concept"} in ${context.topicName} and explain a trade-off you would consider?`,
      topic: context.topicName,
      difficulty: context.difficulty,
      questionType: "follow_up",
      reason: "Deepen understanding with a practical example and a trade-off.",
    };
  }

  async evaluateAnswer(context: EvaluateAnswerContext): Promise<AIEvaluationResponse> {
    const topic = context.curriculum.topics.find((t) => t.name === context.question.topic);
    const concepts = topic?.concepts ?? [];
    const concept =
      concepts.find((c) => context.question.text.toLowerCase().includes(c.name.toLowerCase())) ?? concepts[0];
    const keywords = concept?.keywords ?? [];

    const lower = context.answer.toLowerCase();
    const matched = keywords.filter((k) => lower.includes(k.toLowerCase()));
    const matchRatio = keywords.length > 0 ? matched.length / keywords.length : 0;
    const lengthScore = Math.min(1, context.answer.length / 400);
    const score = Math.round(Math.min(100, Math.max(25, matchRatio * 70 + lengthScore * 30)));

    const missing = keywords.filter((k) => !lower.includes(k.toLowerCase()));

    return {
      score,
      correctness: round1(matchRatio),
      conceptUnderstanding: round1(Math.min(1, matchRatio * 0.7 + 0.3)),
      communication: round1(lengthScore),
      strengths:
        matched.length > 0 ? matched.map((k) => `Correctly covered: ${k}`) : [],
      weaknesses:
        score < 60
          ? ["Answer is brief and lacks technical detail."]
          : missing.length > 0
            ? [`Did not discuss: ${missing.slice(0, 2).join(", ")}`]
            : [],
      missingConcepts: missing.slice(0, 3),
      feedback:
        score >= 85
          ? "Excellent understanding."
          : score >= 60
            ? "Good understanding, with room to deepen some concepts."
            : "The answer needs improvement. Review the key concepts.",
    };
  }

  async generateFinalFeedback(context: FinalFeedbackContext): Promise<AIFeedbackResponse> {
    const evals = context.evaluations;
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const overall = Math.round(avg(evals.map((e) => e.score)));
    const technical = Math.round(avg(evals.map((e) => e.correctness)) * 100);
    const communication = Math.round(avg(evals.map((e) => e.communication)) * 100);

    const strengths = uniq(evals.flatMap((e) => e.strengths)).slice(0, 5);
    const weaknesses = uniq(evals.flatMap((e) => e.weaknesses)).slice(0, 5);
    const missing = uniq(evals.flatMap((e) => e.missingConcepts)).slice(0, 5);

    return {
      overallScore: overall,
      technicalScore: technical,
      communicationScore: communication,
      strengths,
      weaknesses,
      topicScores: {},
      recommendations: missing.map((m) => `Review ${m} to strengthen your fundamentals.`),
      summary: `You answered ${evals.length} question${evals.length === 1 ? "" : "s"} on ${context.curriculum.title} with an overall score of ${overall}/100.`,
    };
  }
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function round1(n: number): number {
  return Math.round(n * 100) / 100;
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr)];
}
