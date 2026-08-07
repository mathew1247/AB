import type { FinalFeedbackContext } from "../ai/ai.provider";

export function buildFeedbackSystemPrompt(): string {
  return `You are an expert technical interviewer producing the final structured feedback report for a completed interview.

TASK:
Generate the final feedback report.

RULES:
1. overallScore, technicalScore and communicationScore are 0-100.
2. strengths and weaknesses are short, specific phrases drawn from the transcript.
3. recommendations are concrete, actionable study suggestions.
4. summary is 2-4 sentences.
5. topicScores maps topic names to average scores (may be an empty object).
6. Return valid JSON only, with no extra text.`;
}

export function buildFeedbackUserPrompt(context: FinalFeedbackContext): string {
  return `TASK: Generate the final interview feedback report.

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

Curriculum: ${context.curriculum.title}

FULL TRANSCRIPT:
${context.history
  .map((turn) => {
    if (turn.role === "interviewer") return `Interviewer: ${turn.question.text}`;
    if (turn.role === "candidate") return `Candidate: ${turn.answer}`;
    return `Evaluation: score ${turn.evaluation.score}/100 - ${turn.evaluation.feedback}`;
  })
  .join("\n")}

OUTPUT FORMAT (valid JSON only):
{"overallScore": 0-100, "technicalScore": 0-100, "communicationScore": 0-100, "strengths": ["..."], "weaknesses": ["..."], "topicScores": {"topic": score}, "recommendations": ["..."], "summary": "..."}`;
}
