const express = require('express');
const { generatePracticeQuestions, explainPracticeConcept } = require('../controllers/practiceController');

const router = express.Router();

router.post('/questions', generatePracticeQuestions);
router.post('/chat', explainPracticeConcept);

module.exports = router;
