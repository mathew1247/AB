const express = require('express');
// Currently aiService is called directly by interviewController.
// This route file is a placeholder if frontend ever needs to call AI endpoints directly (not recommended for production but good for testing).
const aiService = require('../services/aiService');

const router = express.Router();

router.post('/generate-question', async (req, res, next) => {
    try {
        const question = await aiService.generateQuestion(req.body);
        res.json({ success: true, question });
    } catch (err) {
        next(err);
    }
});

router.post('/evaluate-answer', async (req, res, next) => {
    try {
        const evaluation = await aiService.evaluateAnswer(req.body);
        res.json({ success: true, evaluation });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
