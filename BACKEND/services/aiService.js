const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Mock Fallbacks if no Groq Key
const mockFallback = {
    generateFirst: (role) => ({ text: `Mock first question for ${role}?`, topic: 'General', difficulty: 'medium' }),
    evaluate: () => ({ correctness: "correct", score: 8, feedback: "Good answer.", strengths: ["Good base"], weaknesses: [] }),
    generateNext: () => ({ text: "Mock next question?", topic: 'General', difficulty: 'hard' }),
    report: () => ({ overallScore: 80, technicalLevel: "Strong", strengths: [], weaknesses: [], topicsToImprove: [], summary: "Mock report." })
};

exports.generateFirstQuestion = async (candidateData) => {
    if (!groq) return mockFallback.generateFirst(candidateData.member.jobRole);

    const { jobRole, yearsExperience, education } = candidateData.member;
    const missions = candidateData.missions || [];

    const prompt = `You are an expert technical interviewer.
Candidate Profile:
- Role: ${jobRole}
- Experience: ${yearsExperience} years
- Education: ${education}
- Missions history: ${JSON.stringify(missions)}

Generate the MOST appropriate first interview question for this candidate based on their profile.
Return structured JSON only:
{
    "text": "The question text",
    "topic": "The technical topic (e.g., Data Engineering, JavaScript)",
    "difficulty": "easy, medium, or hard"
}`;

    return await callGroqJson(prompt);
};

exports.evaluateAnswer = async ({ candidate, question, answer }) => {
    if (!groq) return mockFallback.evaluate();

    const { jobRole, yearsExperience } = candidate.member;

    const prompt = `You are an expert technical interviewer evaluating an answer.
Candidate Role: ${jobRole} (${yearsExperience} years experience)
Question: "${question}"
Candidate Answer: "${answer}"

Evaluate the answer objectively. Do not judge personal characteristics.
Return structured JSON only:
{
    "correctness": "correct, partially correct, or incorrect",
    "score": <number 0-10>,
    "feedback": "1-2 sentence constructive feedback",
    "strengths": ["list of identified strengths"],
    "weaknesses": ["list of missing concepts or errors"]
}`;

    return await callGroqJson(prompt);
};

exports.generateNextQuestion = async ({ candidate, evaluation, previousQuestions, currentTopic, currentDifficulty }) => {
    if (!groq) return mockFallback.generateNext();

    const { jobRole } = candidate.member;
    const { score, correctness, weaknesses } = evaluation;

    const prompt = `You are an expert technical interviewer.
Candidate Role: ${jobRole}
Previous Score: ${score}/10 (${correctness})
Weaknesses detected: ${weaknesses.join(', ')}
Previous Questions asked (DO NOT REPEAT THESE): ${previousQuestions.join(' | ')}
Last Topic: ${currentTopic}, Last Difficulty: ${currentDifficulty}

ADAPTIVE LOGIC RULES:
- If previous answer was correct (score >= 7): Increase difficulty, ask a deeper follow-up question.
- If partially correct (score 4-6): Target the missing concept/weakness. Maintain difficulty.
- If incorrect (score <= 3): Test a foundational concept related to the weakness. Reduce difficulty.

NEVER repeat a previous question.
Return structured JSON only:
{
    "text": "The next question text",
    "topic": "The relevant technical topic",
    "difficulty": "easy, medium, or hard",
    "reason": "Why you chose this question based on the adaptive logic rules"
}`;

    return await callGroqJson(prompt);
};

exports.generateFinalReport = async (session) => {
    if (!groq) return { summary: "Mock summary.", strengths: [], gaps: [], next: [] };

    const prompt = `Generate a final interview report for a ${session.candidateProfile.member.jobRole}.
Questions asked: ${session.questionHistory.length}
Total points gathered: ${session.score} (Max possible: ${session.questionHistory.length * 10})
Evaluations: ${JSON.stringify(session.evaluations.map(e => e.feedback))}

Based on this, return structured JSON only:
{
  "summary": "Concise 2-sentence summary of performance",
  "strengths": ["list of concise actionable points"],
  "gaps": ["list of concise actionable points representing knowledge gaps"],
  "next": ["list of concise actionable next steps or topics to study"]
}`;

    return await callGroqJson(prompt);
};

async function callGroqJson(prompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });
        return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error("Unable to parse AI response.");
    }
}
