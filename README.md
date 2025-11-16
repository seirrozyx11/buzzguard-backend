# BuzzGuard Feedback API Server

🚁 A Node.js backend server for handling user feedback from the BuzzGuard website.

## 🎨 Features

- **Feedback Management**: Complete CRUD operations for user feedback
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **Input Validation**: Comprehensive validation using Joi
- **Rate Limiting**: Protection against spam and abuse
- **CORS Support**: Secure cross-origin requests
- **Auto-categorization**: Smart tagging based on feedback content
- **Public API**: Endpoints for displaying feedback on website
- **Admin Operations**: Simple admin interface for management
- **Render Deploy Ready**: Configured for easy deployment

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `GET` | `/` | API information and health | 100/15min |
| `GET` | `/health` | Server health check | 100/15min |
| `POST` | `/api/feedback` | Submit new feedback | 3/10min |
| `GET` | `/api/feedback` | Get public feedback (paginated) | 100/15min |
| `GET` | `/api/feedback/recent` | Get recent public feedback | 100/15min |
| `GET` | `/api/feedback/stats` | Get feedback statistics | 100/15min |
| `GET` | `/api/feedback/:id` | Get specific feedback | 100/15min |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `DELETE` | `/api/feedback/:id` | Delete feedback | Admin Key |

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 16+ and npm 8+
- MongoDB Atlas account or local MongoDB instance

### Local Development

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy `.env` and update with your values:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/buzzguard_feedback
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5500
   ADMIN_KEY=your-secure-admin-key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Server will be available at: `http://localhost:5000`

## 🚀 Deployment to Render

### Method 1: Auto-Deploy with render.yaml

1. **Connect GitHub repository to Render**
2. **Render will automatically detect `render.yaml`**
3. **Set environment variables in Render dashboard:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `FRONTEND_URL`: Your website domain
   - `ADMIN_KEY`: Secure random key for admin operations

### Method 2: Manual Deploy

1. **Create Web Service in Render:**
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   FRONTEND_URL=https://your-domain.com
   ADMIN_KEY=secure-random-key
   ```

3. **Deploy:**
   - Render will build and deploy automatically
   - Your API will be available at `https://your-app.onrender.com`

## 📊 MongoDB Setup

### MongoDB Atlas (Recommended)

1. **Create free cluster at [MongoDB Atlas](https://cloud.mongodb.com/)**
2. **Create database user and get connection string**
3. **Whitelist IP addresses (0.0.0.0/0 for Render)**
4. **Update `MONGODB_URI` with your connection string**

### Connection String Format:
```
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

## 🗺️ Frontend Integration

### Submit Feedback

```javascript
// Example: Submitting feedback from your website
async function submitFeedback(formData) {
  try {
    const response = await fetch('https://your-api.onrender.com/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        message: formData.message
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Feedback submitted successfully!');
      // Show success message to user
    } else {
      console.error('Error:', result.message);
      // Show error message to user
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### Display Recent Feedback

```javascript
// Example: Loading recent feedback for website display
async function loadRecentFeedback() {
  try {
    const response = await fetch('https://your-api.onrender.com/api/feedback/recent?limit=5');
    const result = await response.json();
    
    if (result.success) {
      const feedbacks = result.data;
      // Display feedback on your website
      feedbacks.forEach(feedback => {
        console.log(`${feedback.name}: ${feedback.message}`);
      });
    }
  } catch (error) {
    console.error('Error loading feedback:', error);
  }
}
```

## 🛡️ Security Features

- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Comprehensive validation with Joi
- **CORS Protection**: Whitelist specific domains
- **Helmet Security**: HTTP headers security
- **IP Tracking**: Monitor submission sources
- **Duplicate Prevention**: Prevents repeat submissions

## 📊 Monitoring & Logs

- **Health Check**: `GET /health` for monitoring services
- **Error Logging**: Comprehensive error tracking
- **Request Logging**: IP and User-Agent tracking
- **Auto-tagging**: Smart categorization of feedback

## 🗺️ File Structure

```
backend/
├── index.js              # Main server file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables
├── render.yaml           # Render deployment config
├── models/
│   └── Feedback.js       # Feedback model with validation
└── routes/
    └── feedback.js       # Feedback API routes
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Verify connection string format
   - Check network access (whitelist IPs)
   - Ensure database user has correct permissions

2. **CORS Errors**:
   - Add your frontend domain to CORS origins
   - Check `FRONTEND_URL` environment variable

3. **Rate Limiting**:
   - Adjust rate limits in code if needed
   - Check if IP is being blocked

4. **Deployment Issues**:
   - Check Render logs for errors
   - Verify all environment variables are set
   - Ensure MongoDB is accessible from Render

### Environment Variables Checklist

- ✓ `MONGODB_URI` - MongoDB connection string
- ✓ `PORT` - Server port (Render sets automatically)
- ✓ `NODE_ENV` - Set to 'production' for deployment
- ✓ `FRONTEND_URL` - Your website domain for CORS
- ✓ `ADMIN_KEY` - Secure key for admin operations

## 📈 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## 📝 License

MIT License - See package.json for details.

---

**BuzzGuard Team** • Assumption College of Davao • 2025