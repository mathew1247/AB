const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    candidateId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Candidate',
        required: true
    },
    interviewId: {
        type: String,
        required: true,
        unique: true
    },
    company: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['IN_PROGRESS', 'FINISHED'],
        default: 'IN_PROGRESS'
    },
    totalScore: {
        type: Number,
        default: 0
    },
    questions: [{
        questionId: String,
        questionText: String,
        candidateAnswer: String,
        score: Number,
        feedback: String,
        difficulty: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
