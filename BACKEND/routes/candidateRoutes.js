const express = require('express');
const { getCandidates, getCandidate } = require('../controllers/candidateController');

const router = express.Router();

router.route('/')
    .get(getCandidates);

router.route('/:id')
    .get(getCandidate);

module.exports = router;
