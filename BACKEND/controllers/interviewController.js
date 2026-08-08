const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const aiService = require('../services/aiService');

// @desc    Start an interview session
// @route   POST /api/interviews/start
// @access  Public
exports.startInterview = async (req, res, next) => {
    try {
        const { candidateId, company, topic, difficulty } = req.body;
        
        const candidate = await Candidate.findOne({ candidateId });
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        const interviewId = 'INT-' + Math.floor(1000 + Math.random() * 9000);
        
        const interview = await Interview.create({
            candidateId: candidate._id,
            interviewId,
            company,
            topic,
            difficulty,
            status: 'IN_PROGRESS'
        });

        // Generate the first question via AI
        const firstQuestion = await aiService.generateQuestion({
            role: candidate.jobRole,
            experience: candidate.yearsExperience,
            topic,
            difficulty,
            previousQuestions: []
        });

        res.status(201).json({
            success: true,
            interviewId: interview.interviewId,
            question: {
                id: 'Q-001',
                text: firstQuestion.text,
                topic: topic,
                difficulty: difficulty
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Submit an answer to an interview question
// @route   POST /api/interviews/:id/answer
// @access  Public
exports.submitAnswer = async (req, res, next) => {
    try {
        const { questionId, answer, topic, difficulty, questionText } = req.body;
        
        const interview = await Interview.findOne({ interviewId: req.params.id }).populate('candidateId');
        if (!interview) {
            return res.status(404).json({ success: false, error: 'Interview not found' });
        }

        // Evaluate the answer via AI
        const evaluation = await aiService.evaluateAnswer({
            role: interview.candidateId.jobRole,
            experience: interview.candidateId.yearsExperience,
            question: questionText,
            answer: answer
        });

        // Save question and answer to the interview
        interview.questions.push({
            questionId,
            questionText,
            candidateAnswer: answer,
            score: evaluation.score,
            feedback: evaluation.feedback,
            difficulty: difficulty
        });

        // Update total score
        const totalPoints = interview.questions.reduce((acc, q) => acc + q.score, 0);
        interview.totalScore = Math.round(totalPoints / interview.questions.length);
        
        await interview.save();

        // Generate next question via AI
        const previousQuestions = interview.questions.map(q => q.questionText);
        const nextQuestionData = await aiService.generateQuestion({
            role: interview.candidateId.jobRole,
            experience: interview.candidateId.yearsExperience,
            topic: interview.topic,
            difficulty: evaluation.nextDifficulty || difficulty,
            previousQuestions: previousQuestions,
            weakAreas: evaluation.weakAreas
        });

        res.status(200).json({
            success: true,
            evaluation: evaluation,
            nextQuestion: {
                id: 'Q-' + String(interview.questions.length + 1).padStart(3, '0'),
                text: nextQuestionData.text,
                topic: interview.topic,
                difficulty: evaluation.nextDifficulty || difficulty
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Finish an interview session
// @route   POST /api/interviews/:id/finish
// @access  Public
exports.finishInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findOneAndUpdate(
            { interviewId: req.params.id },
            { status: 'FINISHED' },
            { new: true, runValidators: true }
        );

        if (!interview) {
            return res.status(404).json({ success: false, error: 'Interview not found' });
        }

        // Here we could update Progress models for the dashboard based on the interview score
        
        res.status(200).json({
            success: true,
            data: interview
        });
    } catch (err) {
        next(err);
    }
};
