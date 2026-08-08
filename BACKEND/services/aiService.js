const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Fallback mock responses if Groq API is not configured
const mockGenerateQuestion = (topic, difficulty) => ({
    text: `Mock Question: Can you explain a concept in ${topic} suitable for ${difficulty} level?`
});

const mockEvaluateAnswer = () => ({
    score: 85,
    correct: true,
    technicalAccuracy: 90,
    completeness: 80,
    feedback: 'Good answer, but could use more real-world examples.',
    weakAreas: ['real-world examples'],
    nextDifficulty: 'hard'
});

exports.generateQuestion = async ({ role, experience, topic, difficulty, previousQuestions, weakAreas }) => {
    if (!groq) {
        console.warn("GROQ_API_KEY is not set. Returning mock question.");
        return mockGenerateQuestion(topic, difficulty);
    }

    const prompt = `You are an expert technical interviewer for a ${role} with ${experience} years of experience.
Topic: ${topic}. Difficulty: ${difficulty}.
Weak Areas to focus on: ${weakAreas ? weakAreas.join(', ') : 'None'}.
Previous questions asked: ${previousQuestions.join(' | ')}.

Generate ONE clear, concise interview question. Do NOT provide the answer. ONLY output the question text.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            temperature: 0.7,
            max_tokens: 100
        });

        return { text: chatCompletion.choices[0].message.content.trim() };
    } catch (error) {
        console.error("Error generating question from Groq:", error);
        return mockGenerateQuestion(topic, difficulty);
    }
};

exports.evaluateAnswer = async ({ role, experience, question, answer }) => {
    if (!groq) {
        console.warn("GROQ_API_KEY is not set. Returning mock evaluation.");
        return mockEvaluateAnswer();
    }

    const prompt = `You are a technical interviewer for a ${role} with ${experience} years experience.
Question asked: "${question}"
Candidate's answer: "${answer}"

Evaluate the answer and return a JSON object with EXACTLY these keys:
{
  "score": (0-100),
  "correct": (boolean),
  "technicalAccuracy": (0-100),
  "completeness": (0-100),
  "feedback": (string, brief 1-2 sentence constructive feedback),
  "weakAreas": (array of strings, e.g. ["pointers", "real-world examples"]),
  "nextDifficulty": (string, one of: "easy", "medium", "hard")
}

Return ONLY valid JSON.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            temperature: 0.2, // Lower temperature for more deterministic JSON
            response_format: { type: "json_object" }
        });

        const content = chatCompletion.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("Error evaluating answer from Groq:", error);
        return mockEvaluateAnswer();
    }
};
