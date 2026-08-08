const express = require('express');
const { handleInterview } = require('../controllers/interviewController');

const router = express.Router();

router.post('/', handleInterview);

module.exports = router;
