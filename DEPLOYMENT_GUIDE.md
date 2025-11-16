# 🚀 BuzzGuard Feedback API - Deployment Guide

## Quick Setup for Render + MongoDB

### 1. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new account or sign in
   - Create a new cluster (free tier is sufficient)

2. **Database Configuration**
   - Cluster Name: `buzzguard-cluster`
   - Database Name: `buzzguard_feedback`
   - Username: Create a database user
   - Password: Generate a secure password
   - IP Whitelist: `0.0.0.0/0` (allow access from anywhere for Render)

3. **Get Connection String**
   ```
   mongodb+srv://<username>:<password>@buzzguard-cluster.xxxxx.mongodb.net/buzzguard_feedback?retryWrites=true&w=majority
   ```

### 2. Render Deployment

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Create new "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder

2. **Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Node Version: `16` or higher

3. **Environment Variables**
   Set these in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-connection-string>
   FRONTEND_URL=<your-website-domain>
   ADMIN_KEY=<generate-secure-random-key>
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Your API will be available at: `https://your-service-name.onrender.com`

### 3. Update Frontend

Update your website's `script.js` with your deployed API URL:

```javascript
// Replace this line in script.js
const API_BASE = 'https://your-service-name.onrender.com';
```

### 4. Test Everything

1. **Test API Health**: Visit `https://your-service-name.onrender.com/health`
2. **Submit Feedback**: Use your website's contact form
3. **View Feedback**: Check `https://your-service-name.onrender.com/api/feedback/recent`

## 🔧 Local Development

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   Copy `.env` file and update:
   ```env
   MONGODB_URI=mongodb://localhost:27017/buzzguard_feedback
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5500
   ADMIN_KEY=local-admin-key
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

## 🔐 Security Checklist

- ✅ Rate limiting enabled
- ✅ Input validation with Joi
- ✅ CORS configured for your domain
- ✅ Helmet security headers
- ✅ Environment variables for secrets
- ✅ MongoDB connection secured
- ✅ Admin operations protected

## 📊 Monitoring

- **Health Check**: `GET /health`
- **API Status**: `GET /`
- **Logs**: Check Render dashboard for server logs
- **Database**: Monitor MongoDB Atlas dashboard

## 🆘 Troubleshooting

**Common Issues:**

1. **Database Connection Failed**
   - Verify MongoDB URI is correct
   - Check IP whitelist includes `0.0.0.0/0`
   - Ensure database user has read/write permissions

2. **CORS Errors**
   - Update `FRONTEND_URL` environment variable
   - Check website domain is correct

3. **Rate Limiting Issues**
   - Adjust rate limits in code if needed
   - Clear browser cache and try again

4. **Form Submission Fails**
   - Check API URL in website code
   - Verify all required fields are filled
   - Check browser network tab for errors

## 📞 Support

For deployment issues:
- Check Render logs in dashboard
- Verify environment variables are set
- Test API endpoints individually
- Check MongoDB connection status

---

**Happy Deploying! 🎉**