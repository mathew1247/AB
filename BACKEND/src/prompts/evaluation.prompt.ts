import type { EvaluateAnswerContext } from "../ai/ai.provider";

export function buildEvaluationSystemPrompt(): string {
  return `You are an expert technical interviewer evaluating a candidate's spoken/written answer.

TASK:
Evaluate the candidate's answer to the given interview question.

RULES:
1. Be fair and objective.
2. score is 0-100 overall.
3. correctness, conceptUnderstanding and communication are each 0.0 to 1.0.
4. strengths/weaknesses/missingConcepts must be short, specific phrases.
5. feedback is 1-2 sentences of constructive coaching.
6. Return valid JSON only, with no extra text.`;
}

export function buildEvaluationUserPrompt(context: EvaluateAnswerContext): string {
  return `TASK: Evaluate the candidate's answer.

CONTEXT:
Candidate profile:
${JSON.stringify(
  {
    name: context.candidate.name,
    experience: `${context.candidate.experience} years`,
    skills: context.candidate.skills,
  },
  null,
  2,
)}

QUESTION:
${context.question.text}
TOPIC: ${context.question.topic}
DIFFICULTY: ${context.difficulty}

CANDIDATE ANSWER (verbatim):
${context.answer}

PREVIOUS EVALUATIONS (for calibration):
${context.previousEvaluations.length > 0 ? JSON.stringify(context.previousEvaluations, null, 2) : "none"}

OUTPUT FORMAT (valid JSON only):
{"score": 0-100, "correctness": 0.0-1.0, "conceptUnderstanding": 0.0-1.0, "communication": 0.0-1.0, "strengths": ["..."], "weaknesses": ["..."], "missingConcepts": ["..."], "feedback": "..."}`;
}
