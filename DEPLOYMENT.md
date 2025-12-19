# Deployment Guide for Render

This guide will help you deploy the Admin Dashboard to Render.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. A MongoDB database (MongoDB Atlas recommended)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your MongoDB Database

1. **Create a MongoDB Atlas account** (or use your existing MongoDB instance)
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier available)
   - Create a database user
   - Whitelist Render's IP addresses (or use `0.0.0.0/0` for testing - not recommended for production)
   - Get your connection string (MongoDB URI)

2. **Seed your database** (optional but recommended)
   - You can use the seed API endpoint after deployment: `POST /api/admin/seed`
   - Or manually create an admin user in your database

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect your repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Render will automatically detect the `render.yaml` file

3. **Set Environment Variables in Render Dashboard**
   - Go to your service settings
   - Navigate to "Environment" tab
   - Add the following environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A strong random string (generate with: `openssl rand -base64 32`)
     - `NODE_ENV`: `production`

4. **Deploy**
   - Render will automatically build and deploy your application
   - The build command: `npm install && npm run build`
   - The start command: `npm start`

### Option B: Manual Setup

1. **Create a new Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your Git repository

2. **Configure the Service**
   - **Name**: `admin-dashboard` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose based on your needs (Starter for testing, Standard/Pro for production)

3. **Set Environment Variables**
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong random string
   - `NODE_ENV`: `production`

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your application

## Step 3: Post-Deployment Setup

1. **Create Admin User** (if not seeded)
   - You can use the seed endpoint: `POST https://your-app.onrender.com/api/admin/seed`
   - Or manually create an admin user in MongoDB

2. **Test the Application**
   - Visit your Render URL: `https://your-app.onrender.com`
   - Try logging in with your admin credentials

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | Random string (32+ characters) |
| `NODE_ENV` | Node environment | Yes | `production` |

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Issues
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas IP whitelist includes Render IPs
- Ensure database user has proper permissions

### Application Crashes
- Check application logs in Render dashboard
- Verify all environment variables are set
- Ensure MongoDB is accessible from Render

### Authentication Issues
- Verify `JWT_SECRET` is set and consistent
- Check cookie settings (should work with Render's HTTPS)

## Security Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong JWT_SECRET** - Generate with `openssl rand -base64 32`
3. **Restrict MongoDB IP whitelist** - Don't use `0.0.0.0/0` in production
4. **Use HTTPS** - Render provides SSL certificates automatically
5. **Keep dependencies updated** - Regularly update npm packages

## Cost Considerations

- **Free Tier**: Suitable for testing, has limitations (spins down after inactivity)
- **Starter Plan**: $7/month - Better for development/testing
- **Standard/Pro Plans**: For production workloads

## Support

For issues specific to:
- **Render**: Check [Render Documentation](https://render.com/docs)
- **MongoDB Atlas**: Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- **Application**: Check application logs in Render dashboard

