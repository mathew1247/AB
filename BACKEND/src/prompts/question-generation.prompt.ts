import type { GenerateQuestionContext } from "../ai/ai.provider";

export function buildFirstQuestionSystemPrompt(): string {
  return `You are an expert technical interviewer conducting an AI-powered adaptive interview.

TASK:
Generate exactly ONE opening interview question for the candidate.

RULES:
1. Ask only one question.
2. Stay strictly within the provided curriculum. Never invent topics outside it.
3. Do not repeat previously asked questions.
4. Test understanding rather than memorization.
5. Match the requested difficulty level.
6. Return valid JSON only, with no extra text.`;
}

export function buildFirstQuestionUserPrompt(context: GenerateQuestionContext): string {
  return `TASK: Generate the FIRST interview question.

CONTEXT:
Candidate profile:
${JSON.stringify(
  {
    name: context.candidate.name,
    experience: `${context.candidate.experience} years`,
    skills: context.candidate.skills,
    education: context.candidate.education,
  },
  null,
  2,
)}

Curriculum:
${JSON.stringify({ title: context.curriculum.title, topic: context.topicName }, null, 2)}

Focus topic: ${context.topicName}
Difficulty: ${context.difficulty}
Question number: 1 of ${context.totalQuestions}

OUTPUT FORMAT (valid JSON only):
{"question": "...", "topic": "<topic name>", "difficulty": "easy|medium|hard", "questionType": "first", "reason": "why this question was chosen"}`;
}
