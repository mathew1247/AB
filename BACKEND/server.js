const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env variables
dotenv.config();

// Connect to database
// Uncomment the line below once MONGODB_URI is provided in .env
// connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
