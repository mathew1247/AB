const aiService = require('../services/aiService');
const { getCandidateById } = require('./candidateController');

// In-memory store for active interview sessions
const sessions = {};

// @desc    Start an interview session
// @route   POST /api/interview/start
// @access  Public
exports.startInterview = async (req, res, next) => {
    try {
        const { candidateId } = req.body;
        
        if (!candidateId) {
            return res.status(400).json({ success: false, error: 'candidateId is required' });
        }

        const candidateData = getCandidateById(candidateId);
        if (!candidateData) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        const sessionId = 'INT-' + Math.random().toString(36).substr(2, 9);
        
        // Initialize session
        sessions[sessionId] = {
            sessionId,
            candidateId,
            candidateProfile: candidateData,
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
        const firstQuestionData = await aiService.generateFirstQuestion(candidateData);

        sessions[sessionId].currentQuestion = firstQuestionData;
        sessions[sessionId].questionCount = 1;
        sessions[sessionId].topicsCovered.push(firstQuestionData.topic);

        res.status(201).json({
            success: true,
            sessionId: sessionId,
            candidate: candidateData.member,
            question: {
                id: 'Q1',
                text: firstQuestionData.text,
                topic: firstQuestionData.topic,
                difficulty: firstQuestionData.difficulty
            }
        });
    } catch (err) {
        console.error("Start interview error", err);
        next(err);
    }
};

// @desc    Submit an answer to an interview question
// @route   POST /api/interview/answer
// @access  Public
exports.submitAnswer = async (req, res, next) => {
    try {
        const { sessionId, answer } = req.body;
        
        if (!sessionId || !answer) {
            return res.status(400).json({ success: false, error: 'sessionId and answer are required' });
        }

        const session = sessions[sessionId];
        if (!session) {
            return res.status(404).json({ success: false, error: 'Interview session not found' });
        }

        const currentQ = session.currentQuestion;

        // Evaluate the answer via AI
        const evaluation = await aiService.evaluateAnswer({
            candidate: session.candidateProfile,
            question: currentQ.text,
            answer: answer,
            previousQuestions: session.questionHistory
        });

        // Save history
        session.questionHistory.push(currentQ.text);
        session.answerHistory.push(answer);
        session.evaluations.push(evaluation);
        session.score += evaluation.score;

        // Generate next question via AI using the adaptive logic
        const nextQuestionData = await aiService.generateNextQuestion({
            candidate: session.candidateProfile,
            evaluation: evaluation,
            previousQuestions: session.questionHistory,
            currentTopic: currentQ.topic,
            currentDifficulty: currentQ.difficulty
        });

        session.currentQuestion = nextQuestionData;
        session.questionCount += 1;
        session.currentDifficulty = nextQuestionData.difficulty;

        res.status(200).json({
            success: true,
            evaluation: evaluation,
            nextQuestion: {
                id: 'Q' + session.questionCount,
                text: nextQuestionData.text,
                topic: nextQuestionData.topic,
                difficulty: nextQuestionData.difficulty
            }
        });
    } catch (err) {
        console.error("Submit answer error", err);
        next(err);
    }
};

// @desc    End an interview session
// @route   POST /api/interview/end
// @access  Public
exports.endInterview = async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        const session = sessions[sessionId];

        if (!session) {
            return res.status(404).json({ success: false, error: 'Interview session not found' });
        }

        session.status = "FINISHED";
        
        const report = await aiService.generateFinalReport(session);

        res.status(200).json({
            success: true,
            report: report
        });
    } catch (err) {
        next(err);
    }
};
