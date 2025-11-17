require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');

async function migrateRatings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all feedback without rating field
    const feedbackWithoutRating = await Feedback.countDocuments({ 
      rating: { $exists: false } 
    });
    
    console.log(`Found ${feedbackWithoutRating} feedback entries without rating`);

    if (feedbackWithoutRating > 0) {
      // Update all feedback without rating to have default rating of 5
      const result = await Feedback.updateMany(
        { rating: { $exists: false } },
        { $set: { rating: 5 } }
      );
      
      console.log(`✅ Successfully updated ${result.modifiedCount} feedback entries with default rating of 5`);
    } else {
      console.log('✅ All feedback already has ratings');
    }

    // Verify stats
    const stats = await Feedback.getStats();
    console.log('\nUpdated Stats:');
    console.log(`Total Feedback: ${stats.total}`);
    console.log(`Average Rating: ${stats.averageRating}/5`);
    console.log(`User Satisfaction: ${stats.satisfactionPercentage}%`);
    console.log(`High Ratings (4-5 stars): ${stats.highRatingCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateRatings();
