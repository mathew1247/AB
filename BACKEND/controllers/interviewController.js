const aiService = require('../services/aiService');

// In-memory store for active interview sessions
const sessions = {};
const MAX_QUESTIONS = 10; // Define when the interview should end

// @desc    Handle single POST endpoint for interview flow
// @route   POST /api/interview
// @access  Public
exports.handleInterview = async (req, res, next) => {
    try {
        const { sessionId, candidate, message } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        // 1. START INTERVIEW
        if (candidate) {
            // Initialize session
            sessions[sessionId] = {
                sessionId,
                candidateProfile: candidate,
                currentDifficulty: "medium",
                questionCount: 0,
                topicsCovered: [],
                questionHistory: [],
                answerHistory: [],
                evaluations: [],
                score: 0,
                status: "IN_PROGRESS"
            };

            // Generate the first question via AI based on profile
            const firstQuestionData = await aiService.generateFirstQuestion(candidate);

            sessions[sessionId].currentQuestion = firstQuestionData;
            sessions[sessionId].questionCount = 1;
            sessions[sessionId].topicsCovered.push(firstQuestionData.topic);

            return res.status(200).json({
                reply: firstQuestionData.text,
                done: false
            });
        }

        // 2. CONVERSATION TURN
        if (message) {
            const session = sessions[sessionId];
            if (!session) {
                return res.status(404).json({ success: false, error: 'Interview session not found' });
            }

            if (session.status === "FINISHED") {
                return res.status(400).json({ success: false, error: 'Interview is already completed' });
            }

            const currentQ = session.currentQuestion;

            // Evaluate the answer via AI
            const evaluation = await aiService.evaluateAnswer({
                candidate: session.candidateProfile,
                question: currentQ.text,
                answer: message,
                previousQuestions: session.questionHistory
            });

            // If the AI flags a complete topic/technology mismatch or invalid response
            if (evaluation.correctness === "incorrect" && 
                (evaluation.feedback.toLowerCase().includes("mismatch") || 
                 evaluation.feedback.toLowerCase().includes("unrelated") ||
                 evaluation.score === 0)) {
                return res.status(200).json({
                    reply: "You have entered something else expecting the correct answer. Please provide a detailed response",
                    done: false
                });
            }

            // Save history
            session.questionHistory.push(currentQ.text);
            session.answerHistory.push(message);
            session.evaluations.push(evaluation);
            session.score += evaluation.score;

            // 3. CHECK IF INTERVIEW SHOULD END
            if (session.questionCount >= MAX_QUESTIONS) {
                session.status = "FINISHED";
                const feedback = await aiService.generateFinalReport(session);
                
                return res.status(200).json({
                    reply: "Interview completed. Thank you for your time.",
                    done: true,
                    feedback: feedback
                });
            }

            // Generate next question via AI using the adaptive logic
            const nextQuestionData = await aiService.generateNextQuestion({
                candidate: session.candidateProfile,
                evaluation: evaluation,
                previousQuestions: session.questionHistory,
                currentTopic: currentQ.topic,
                currentDifficulty: session.currentDifficulty
            });

            session.currentQuestion = nextQuestionData;
            session.questionCount += 1;
            session.currentDifficulty = nextQuestionData.difficulty;

            return res.status(200).json({
                reply: nextQuestionData.text,
                done: false
            });
        }

        return res.status(400).json({ success: false, error: 'Invalid request payload. Must provide candidate or message.' });

    } catch (err) {
        console.error("Interview handler error", err);
        next(err);
    }
};
