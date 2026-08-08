const express = require('express');
const { getCandidateCourses, getCandidateProgress } = require('../controllers/courseController');

const router = express.Router();

router.route('/:candidateId')
    .get(getCandidateCourses);

router.route('/:candidateId/progress')
    .get(getCandidateProgress);

module.exports = router;
