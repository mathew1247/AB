const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    candidateId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Candidate',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    months: [{
        month: { type: String, required: true },
        score: { type: Number, required: true }
    }],
    totalQuestionsSolved: { type: Number, default: 0 },
    activeStreak: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);
