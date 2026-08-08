const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    candidateId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Candidate',
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Intermediate'
    },
    progress: {
        type: Number,
        default: 0
    },
    tags: [String],
    completedTopicsCount: { type: Number, default: 0 },
    totalTopicsCount: { type: Number, default: 0 },
    icon: { type: String, default: '📚' }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
