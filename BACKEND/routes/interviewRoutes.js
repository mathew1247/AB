const express = require('express');
const { startInterview, submitAnswer, finishInterview } = require('../controllers/interviewController');

const router = express.Router();

router.route('/start')
    .post(startInterview);

router.route('/:id/answer')
    .post(submitAnswer);

router.route('/:id/finish')
    .post(finishInterview);

module.exports = router;
