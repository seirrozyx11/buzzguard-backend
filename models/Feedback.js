const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email address']
  },
  contactNumber: {
    type: String,
    required: false,
    trim: true,
    minlength: [10, 'Contact number must be at least 10 digits'],
    maxlength: [20, 'Contact number cannot exceed 20 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5 // Default to 5 stars if not specified
  },
  status: {
    type: String,
    enum: ['new', 'read', 'responded', 'archived'],
    default: 'new'
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  response: {
    message: String,
    respondedBy: String,
    respondedAt: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ email: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ isPublic: 1, status: 1 });

// Virtual for formatted creation date
feedbackSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for time ago
feedbackSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return this.createdAt.toLocaleDateString();
});

// Pre-save middleware to auto-tag based on message content
feedbackSchema.pre('save', function(next) {
  if (this.isNew && this.message) {
    const message = this.message.toLowerCase();
    const autoTags = [];
    
    // Auto-categorize based on message content
    if (message.includes('bug') || message.includes('error') || message.includes('issue')) {
      autoTags.push('bug-report');
      this.priority = 'high';
    }
    if (message.includes('feature') || message.includes('suggestion') || message.includes('improve')) {
      autoTags.push('feature-request');
    }
    if (message.includes('app') || message.includes('mobile')) {
      autoTags.push('mobile-app');
    }
    if (message.includes('device') || message.includes('esp32') || message.includes('hardware')) {
      autoTags.push('hardware');
    }
    if (message.includes('great') || message.includes('awesome') || message.includes('love')) {
      autoTags.push('positive');
    }
    if (message.includes('problem') || message.includes('difficult') || message.includes('hate')) {
      autoTags.push('negative');
      this.priority = 'high';
    }
    
    this.tags = [...new Set([...this.tags, ...autoTags])];
  }
  next();
});

// Static method to get public feedback
feedbackSchema.statics.getPublicFeedback = function(limit = 10) {
  return this.find({ isPublic: true, status: { $ne: 'archived' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name message createdAt formattedDate timeAgo tags priority');
};

// Static method to get feedback stats
feedbackSchema.statics.getStats = async function() {
  const [
    total,
    newCount,
    read,
    responded,
    high,
    urgent,
    ratingStats
  ] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'new' }),
    this.countDocuments({ status: 'read' }),
    this.countDocuments({ status: 'responded' }),
    this.countDocuments({ priority: 'high' }),
    this.countDocuments({ priority: 'urgent' }),
    this.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ])
  ]);
  
  // Calculate average rating (default to 4.8 if no ratings)
  const avgRating = ratingStats.length > 0 && ratingStats[0].averageRating 
    ? Number(ratingStats[0].averageRating.toFixed(1))
    : 4.8;
  
  // Calculate user satisfaction percentage
  // Satisfaction = users who gave 4-5 stars / total feedback * 100
  const highRatingCount = await this.countDocuments({ rating: { $gte: 4 } });
  const satisfactionPercentage = total > 0 
    ? Math.round((highRatingCount / total) * 100)
    : 97;
  
  return {
    total,
    new: newCount,
    read,
    responded,
    highPriority: high,
    urgent,
    averageRating: avgRating,
    satisfactionPercentage,
    highRatingCount
  };
};

module.exports = mongoose.model('Feedback', feedbackSchema);