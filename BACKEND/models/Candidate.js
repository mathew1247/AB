const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    candidateId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    jobRole: {
        type: String,
        required: true
    },
    yearsExperience: {
        type: Number,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
        default: 'PENDING'
    }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
