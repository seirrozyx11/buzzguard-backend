// Simple script to call the migration endpoint
// Run this after backend is deployed: node call-migration.js

const BACKEND_URL = 'https://buzzguard-backend.onrender.com';
const ADMIN_KEY = 'your-admin-key-here'; // Replace with actual admin key from .env

async function runMigration() {
  try {
    console.log('🔄 Calling migration endpoint...');
    
    const response = await fetch(`${BACKEND_URL}/api/feedback/migrate-ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'adminKey': ADMIN_KEY
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Migration successful!');
      console.log(`   Updated: ${data.data.updated} feedback entries`);
      console.log('\n📊 Current Stats:');
      console.log(`   Total Feedback: ${data.data.stats.total}`);
      console.log(`   Average Rating: ${data.data.stats.averageRating}/5`);
      console.log(`   User Satisfaction: ${data.data.stats.satisfactionPercentage}%`);
      console.log(`   High Ratings (4-5★): ${data.data.stats.highRatingCount}`);
    } else {
      console.error('❌ Migration failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error calling migration:', error.message);
  }
}

runMigration();
