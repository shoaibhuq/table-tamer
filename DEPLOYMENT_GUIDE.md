# 🚀 Deployment Guide for My Table App

## Prerequisites

Before deploying, make sure you have:

- A Firebase project set up
- All environment variables configured
- Database ready for production

## 🔧 Environment Variables Setup

Create a `.env.local` file in your project root with these variables:

```bash
# Database
DATABASE_URL="file:./dev.db"  # For SQLite (dev) or your production DB URL

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="your-service-account-email"
FIREBASE_ADMIN_PRIVATE_KEY="your-private-key"

# Twilio (if using SMS features)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# OpenAI (if using AI features)
OPENAI_API_KEY="your-openai-api-key"
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (already done):

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel**:

   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all the environment variables from your `.env.local`

5. **Database Considerations**:
   - SQLite won't work in Vercel's serverless environment
   - Consider upgrading to PostgreSQL, MySQL, or PlanetScale
   - Update your `DATABASE_URL` accordingly

### Option 2: Netlify

1. **Build the app**:

   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `.next` folder to Netlify
   - Or connect your GitHub repository
   - Set environment variables in Netlify settings

### Option 3: Railway

1. **Install Railway CLI**:

   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

### Option 4: DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure build settings:
   - Build command: `npm run build`
   - Run command: `npm start`
3. Set environment variables

## 📊 Database Migration for Production

If moving from SQLite to PostgreSQL:

1. **Update Prisma schema**:

   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Generate new Prisma client**:

   ```bash
   npx prisma generate
   ```

3. **Run migrations**:
   ```bash
   npx prisma db push
   ```

## 🔥 Firebase Deployment (Rules & Functions)

Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Deploy Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

## ✅ Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database ready for production
- [ ] Firebase project configured
- [ ] Build runs successfully (`npm run build`)
- [ ] All API endpoints tested
- [ ] Error handling implemented
- [ ] Security rules updated for production

## 🚨 Common Issues & Solutions

### 1. Database Connection Issues

- Ensure DATABASE_URL is correct for your production database
- SQLite won't work in serverless environments

### 2. Firebase Authentication

- Check that your Firebase config is correct
- Ensure authorized domains include your deployment URL

### 3. Environment Variables

- Make sure all required env vars are set in your deployment platform
- Double-check variable names (case-sensitive)

### 4. Build Errors

- Run `npm run build` locally first
- Check for TypeScript errors
- Ensure all dependencies are installed

## 📱 Post-Deployment

1. **Test all features**:

   - User authentication
   - CRUD operations
   - File uploads
   - SMS notifications (if enabled)

2. **Monitor performance**:

   - Use Vercel Analytics
   - Set up error tracking (Sentry)
   - Monitor database performance

3. **Security**:
   - Review Firebase security rules
   - Ensure no sensitive data in client-side code
   - Set up proper CORS policies

## 🎯 Quick Vercel Deploy

For the fastest deployment with Vercel:

```bash
# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Set environment variables via CLI
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add DATABASE_URL
# ... add all other variables

# Redeploy with environment variables
vercel --prod
```

Your app will be live at the URL provided by Vercel!
