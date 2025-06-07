# 🚀 Quick Deploy Steps

## Current Status

✅ Build successful  
✅ Vercel CLI installed  
✅ Logged into Vercel  
🔄 **Currently**: Vercel is asking to set up deployment

## Next Steps

### 1. Complete Vercel Setup

Answer the prompts:

- Set up and deploy? → **Y**
- Which scope? → Choose your account
- Link to existing project? → **N** (for new project)
- What's your project's name? → **my-table** (or your preferred name)
- In which directory is your code located? → **./** (current directory)

### 2. After Deployment

You'll get a URL like: `https://my-table-xxxx.vercel.app`

### 3. CRITICAL: Set Environment Variables

Your app WILL FAIL without these! Go to:

1. Visit: [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
DATABASE_URL
```

### 4. Database Issue ⚠️

**IMPORTANT**: Your current SQLite database won't work in production!

Options:

- **Quick fix**: Use Vercel Postgres
- **Alternative**: Use Supabase, PlanetScale, or Neon

### 5. Redeploy After Environment Variables

```bash
vercel --prod
```

## 🆘 If Something Goes Wrong

### App loads but crashes:

- Check browser console for errors
- Likely missing environment variables

### Database errors:

- Need to migrate from SQLite to PostgreSQL
- See DEPLOYMENT_GUIDE.md for details

### Firebase errors:

- Add your Vercel domain to Firebase authorized domains
- Go to Firebase Console → Authentication → Settings → Authorized domains
