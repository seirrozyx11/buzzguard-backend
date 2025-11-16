const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Feedback = require('../models/Feedback');

// Validation schema
const feedbackValidation = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  contactNumber: Joi.string().min(10).max(20).required().messages({
    'string.empty': 'Contact number is required',
    'string.min': 'Contact number must be at least 10 digits',
    'string.max': 'Contact number cannot exceed 20 characters'
  }),
  message: Joi.string().min(10).max(1000).required().messages({
    'string.empty': 'Message is required',
    'string.min': 'Message must be at least 10 characters long',
    'string.max': 'Message cannot exceed 1000 characters'
  })
});

// Rate limiting for feedback submission
const feedbackLimiter = require('express-rate-limit')({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // limit each IP to 3 feedback submissions per 10 minutes
  message: {
    error: 'Too many feedback submissions. Please wait 10 minutes before submitting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/feedback
// @desc    Submit new feedback
// @access  Public
router.post('/', feedbackLimiter, async (req, res) => {
  try {
    // Validate input
    const { error, value } = feedbackValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details.map(detail => detail.message)
      });
    }

    // Check for duplicate submissions (same email + similar message in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingFeedback = await Feedback.findOne({
      email: value.email.toLowerCase(),
      createdAt: { $gte: oneHourAgo }
    });

    if (existingFeedback) {
      return res.status(429).json({
        success: false,
        error: 'Duplicate Submission',
        message: 'You have already submitted feedback recently. Please wait before submitting again.'
      });
    }

    // Create new feedback
    const feedbackData = {
      ...value,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    // Return success response (without sensitive data)
    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! We appreciate your input and will review it soon.',
      data: {
        id: feedback._id,
        name: feedback.name,
        message: feedback.message,
        submittedAt: feedback.createdAt,
        status: feedback.status
      }
    });

    // Log feedback submission
    console.log(`📝 New feedback received from ${feedback.name} (${feedback.email})`);
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to submit feedback. Please try again later.'
    });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedback with pagination
// @access  Public (limited data) / Admin (full data)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      publicOnly = 'true'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};
    
    // If publicOnly is true, only show public feedback
    if (publicOnly === 'true') {
      query.isPublic = true;
      query.status = { $ne: 'archived' };
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Get feedback with pagination
    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select(publicOnly === 'true' ? 
        'name message createdAt formattedDate timeAgo tags priority -_id' : 
        '-ipAddress -userAgent'
      );

    const total = await Feedback.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch feedback'
    });
  }
});

// @route   GET /api/feedback/recent
// @desc    Get recent public feedback for website display
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const feedbacks = await Feedback.getPublicFeedback(parseInt(limit));
    
    res.json({
      success: true,
      data: feedbacks,
      count: feedbacks.length
    });
    
  } catch (error) {
    console.error('Error fetching recent feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch recent feedback'
    });
  }
});

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics
// @access  Public (basic stats)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Feedback.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch feedback statistics'
    });
  }
});

// @route   GET /api/feedback/:id
// @desc    Get specific feedback by ID
// @access  Public (limited) / Admin (full)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findById(id)
      .select('-ipAddress -userAgent'); // Hide sensitive data
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Feedback not found'
      });
    }
    
    // Only show public feedback or if it's not archived
    if (!feedback.isPublic || feedback.status === 'archived') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      data: feedback
    });
    
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch feedback'
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (Admin only - simplified version)
// @access  Admin
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminKey } = req.headers;
    
    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }
    
    const feedback = await Feedback.findByIdAndDelete(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to delete feedback'
    });
  }
});

module.exports = router;