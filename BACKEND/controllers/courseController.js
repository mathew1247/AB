const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Candidate = require('../models/Candidate');

// @desc    Get candidate courses
// @route   GET /api/courses/:candidateId
// @access  Public
exports.getCandidateCourses = async (req, res, next) => {
    try {
        const candidate = await Candidate.findOne({ candidateId: req.params.candidateId });
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        const courses = await Course.find({ candidateId: candidate._id });
        res.status(200).json(courses);
    } catch (err) {
        next(err);
    }
};

// @desc    Get candidate progress
// @route   GET /api/courses/:candidateId/progress
// @access  Public
exports.getCandidateProgress = async (req, res, next) => {
    try {
        const { topic } = req.query;
        const candidate = await Candidate.findOne({ candidateId: req.params.candidateId });
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        let query = { candidateId: candidate._id };
        if (topic) {
            query.topic = topic;
        }

        const progress = await Progress.find(query);
        res.status(200).json(progress);
    } catch (err) {
        next(err);
    }
};
