const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Import routes
const feedbackRoutes = require('./routes/feedback');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5500',
    'https://buzzguard-website.netlify.app',
    'https://buzzguard.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;
    if (!mongoURI) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🚁 BuzzGuard Feedback API Server',
    version: '1.0.0',
    status: 'Active',
    endpoints: {
      feedback: {
        'POST /api/feedback': 'Submit new feedback',
        'GET /api/feedback': 'Get all feedback (with pagination)',
        'GET /api/feedback/recent': 'Get recent feedback',
        'DELETE /api/feedback/:id': 'Delete feedback (admin only)'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API routes
app.use('/api/feedback', feedbackRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/feedback',
      'GET /api/feedback',
      'GET /api/feedback/recent'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    });
  }
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : error.message
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BuzzGuard Feedback API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}`);
});

module.exports = app;