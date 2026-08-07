import type { GenerateQuestionContext } from "../ai/ai.provider";

export function buildFollowUpQuestionSystemPrompt(): string {
  return `You are an expert technical interviewer conducting an AI-powered adaptive interview.

TASK:
Generate exactly ONE follow-up question that continues the conversation with the candidate.

RULES:
1. Ask only one question.
2. Stay strictly within the provided curriculum. Never invent topics outside it.
3. The next question MUST be a genuine follow-up influenced by the candidate's previous answer and evaluation.
4. Reference the candidate's own words or a concept they missed. Never ask an unrelated random question.
5. Do not repeat previously asked questions.
6. Adjust difficulty per the requested level.
7. Test understanding rather than memorization.
8. Return valid JSON only, with no extra text.`;
}

export function buildFollowUpQuestionUserPrompt(context: GenerateQuestionContext): string {
  const prev = context.previousTurn;
  return `TASK: Generate a genuine FOLLOW-UP question.

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

Curriculum:
${JSON.stringify({ title: context.curriculum.title, topics: context.curriculum.topics.map((t) => t.name) }, null, 2)}

PREVIOUS QUESTION:
${prev ? prev.question.text : "n/a"}
PREVIOUS ANSWER (verbatim):
${prev ? prev.answer : "n/a"}
PREVIOUS EVALUATION:
${prev ? JSON.stringify(prev.evaluation, null, 2) : "n/a"}

QUESTIONS ALREADY ASKED (do not repeat these):
${context.questionsAsked.map((q) => `- ${q.text}`).join("\n")}

Topics already covered: ${context.coveredTopics.join(", ")}
Focus topic for this question: ${context.topicName}
Difficulty: ${context.difficulty}
Question number: ${context.questionNumber} of ${context.totalQuestions}

OUTPUT FORMAT (valid JSON only):
{"question": "...", "topic": "<topic name>", "difficulty": "easy|medium|hard", "questionType": "follow_up", "reason": "which part of the previous answer this question follows up on"}`;
}
