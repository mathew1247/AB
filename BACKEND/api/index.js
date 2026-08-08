const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('../middleware/errorHandler');

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/candidates', require('../routes/candidateRoutes'));
app.use('/api/interview', require('../routes/interviewRoutes'));
app.use('/api/practice', require('../routes/practiceRoutes'));

// Global error handler
app.use(errorHandler);

module.exports = app;
