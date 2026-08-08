const fs = require('fs');
const path = require('path');

const candidatesPath = path.join(__dirname, '../tests/datasets/candidates.json');

const getCandidatesData = () => {
    try {
        const fileData = fs.readFileSync(candidatesPath, 'utf8');
        return JSON.parse(fileData).candidates;
    } catch (err) {
        console.error("Error reading candidates.json", err);
        return [];
    }
};

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getCandidates = (req, res, next) => {
    try {
        const candidates = getCandidatesData();
        res.status(200).json(candidates.map(c => c.member));
    } catch (err) {
        next(err);
    }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidate = (req, res, next) => {
    try {
        const candidates = getCandidatesData();
        const candidate = candidates.find(c => c.member.id === req.params.id);
        
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }
        res.status(200).json(candidate);
    } catch (err) {
        next(err);
    }
};

exports.getCandidateById = (id) => {
    const candidates = getCandidatesData();
    return candidates.find(c => c.member.id === id);
}
