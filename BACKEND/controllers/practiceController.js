const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Local fallback questions generator in case all APIs fail
const generateMockQuestions = (topic) => {
    const questions = [];
    for (let i = 1; i <= 10; i++) {
        questions.push({
            topic: topic,
            question: `Fallback Question ${i}: What is the primary characteristic or key concept related to ${topic}?`,
            options: [
                `Option A: Essential foundation and core mechanism of ${topic}`,
                `Option B: Secondary performance optimization trait`,
                `Option C: A common misconfiguration or anti-pattern to avoid`,
                `Option D: Legacy deprecated implementation style`
            ],
            correctIndex: 0,
            explanation: `This is a fallback practice question for ${topic} due to temporary API service limits.`
        });
    }
    return { questions };
};

exports.generatePracticeQuestions = async (req, res, next) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, error: 'topic is required' });
        }

        const prompt = `You are an expert technical tutor. Generate exactly 10 single-mark multiple-choice questions about the topic: "${topic}".
Each question must be challenging, have exactly 4 options, a correctIndex (0-3), and a short explanation of the correct choice.
Return structured JSON only matching this schema:
{
  "questions": [
    {
      "topic": "${topic}",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "explanation": "Brief explanation of the correct choice"
    }
  ]
}`;

        // 1. Try Cerebras API
        if (process.env.CEREBRAS_API_KEY) {
            try {
                console.log("Attempting Cerebras completions for topic:", topic);
                const cerebrasRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gemma-4-31b',
                        messages: [{ role: 'user', content: prompt }],
                        response_format: { type: 'json_object' }
                    })
                });

                if (cerebrasRes.status === 200) {
                    const data = await cerebrasRes.json();
                    const parsed = JSON.parse(data.choices[0].message.content);
                    if (parsed.questions && parsed.questions.length > 0) {
                        console.log("Cerebras completion succeeded.");
                        return res.status(200).json(parsed);
                    }
                } else {
                    console.warn(`Cerebras API returned status: ${cerebrasRes.status}. Falling back to Groq.`);
                }
            } catch (err) {
                console.warn("Cerebras API failed with error. Falling back to Groq.", err.message);
            }
        }

        // 2. Try Groq API as primary fallback
        if (groq) {
            try {
                console.log("Attempting Groq fallback completions for topic:", topic);
                const chatCompletion = await groq.chat.completions.create({
                    messages: [{ role: "system", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.2,
                    response_format: { type: "json_object" }
                });
                const parsed = JSON.parse(chatCompletion.choices[0].message.content);
                if (parsed.questions && parsed.questions.length > 0) {
                    console.log("Groq fallback completion succeeded.");
                    return res.status(200).json(parsed);
                }
            } catch (err) {
                console.error("Groq fallback API also failed:", err.message);
            }
        }

        // 3. Fall back to local Mock questions
        console.log("All APIs unavailable. Returning template mock questions.");
        const fallbackData = generateMockQuestions(topic);
        res.status(200).json(fallbackData);

    } catch (err) {
        console.error("Practice controller error", err);
        next(err);
    }
};

exports.explainPracticeConcept = async (req, res, next) => {
    try {
        const { question, topic, userMessage } = req.body;
        if (!userMessage) {
            return res.status(400).json({ success: false, error: 'userMessage is required' });
        }

        const context = question
            ? `The user is currently answering this practice question:\n"${question}"\nTopic: ${topic || 'General'}\n\n`
            : '';

        const prompt = `${context}User asks: "${userMessage}"\n\nProvide a clear, concise, technically accurate explanation in 3-5 sentences. Focus on the core concept, why it matters, and a concrete example if helpful. Do NOT ask follow-up questions. Return plain text only.`;

        // 1. Try Cerebras first
        if (process.env.CEREBRAS_API_KEY) {
            try {
                const cerebrasRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gemma-4-31b',
                        messages: [{ role: 'user', content: prompt }]
                    })
                });
                if (cerebrasRes.status === 200) {
                    const data = await cerebrasRes.json();
                    const reply = data.choices[0].message.content.trim();
                    if (reply) return res.status(200).json({ reply });
                } else {
                    console.warn(`Cerebras chat returned ${cerebrasRes.status}. Falling back to Groq.`);
                }
            } catch (err) {
                console.warn("Cerebras chat failed. Falling back to Groq.", err.message);
            }
        }

        // 2. Groq fallback
        if (groq) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.3
                });
                const reply = completion.choices[0].message.content.trim();
                if (reply) return res.status(200).json({ reply });
            } catch (err) {
                console.error("Groq chat fallback also failed:", err.message);
            }
        }

        res.status(200).json({ reply: "I'm unable to retrieve an explanation right now. Please verify the AI service keys and try again." });

    } catch (err) {
        console.error("explainPracticeConcept error", err);
        next(err);
    }
};
