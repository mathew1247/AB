const Candidate = require('../models/Candidate');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getCandidates = async (req, res, next) => {
    try {
        const candidates = await Candidate.find();
        res.status(200).json(candidates);
    } catch (err) {
        next(err);
    }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findOne({ candidateId: req.params.id });
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }
        res.status(200).json(candidate);
    } catch (err) {
        next(err);
    }
};
