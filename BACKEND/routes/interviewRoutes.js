const express = require('express');
const { startInterview, submitAnswer, endInterview } = require('../controllers/interviewController');

const router = express.Router();

router.route('/start')
    .post(startInterview);

router.route('/answer')
    .post(submitAnswer);

router.route('/end')
    .post(endInterview);

module.exports = router;
