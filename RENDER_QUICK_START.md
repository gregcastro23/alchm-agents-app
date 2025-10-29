# Render Quick Start - 15 Minute Deploy

Deploy Planetary Agents to Render free tier in ~15 minutes.

## 🎯 Prerequisites (5 min)

1. **Accounts** (all free):
   - [Render.com](https://render.com) account
   - [Neon.tech](https://neon.tech) account for database
   - OpenAI API key with credits

2. **Generate Auth Secret**:
   ```bash
   openssl rand -base64 32
   # Save this - you'll need it for NEXTAUTH_SECRET
   ```

## 📊 Step 1: Create Database (3 min)

1. Go to [neon.tech](https://neon.tech) → Sign up/Login
2. Create New Project:
   - Name: `planetary-agents`
   - Region: Choose closest to you (e.g., `US East`)
   - Click "Create Project"
3. Copy **Pooled Connection String**:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/main?sslmode=require
   ```
4. Run migrations from your local machine:
   ```bash
   export DATABASE_URL="<your-pooled-connection-string>"
   cd planetary-agents
   npx prisma migrate deploy
   ```

## 🚀 Step 2: Deploy to Render (7 min)

### Option A: Automatic (Recommended)

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Render will detect `render.yaml` and create services

2. **Set Environment Variables**:

   After blueprint creates services, set these in **BOTH** services:

   **Frontend Service** → Environment tab:
   ```bash
   DATABASE_URL=<your-neon-connection-string>
   NEXTAUTH_SECRET=<your-generated-secret>
   NEXTAUTH_URL=https://<your-frontend-service>.onrender.com
   OPENAI_API_KEY=<your-openai-key>
   ```

   **Backend Service** → Environment tab:
   ```bash
   DATABASE_URL=<same-as-frontend>
   CORS_ORIGINS=https://<your-frontend-service>.onrender.com
   ```

3. **Deploy**:
   - Render will auto-deploy after you save environment variables
   - Or manually: Each service → "Manual Deploy" → "Deploy latest commit"

### Option B: Manual Services

If blueprint fails, create services manually:

**Frontend:**
- Type: Web Service
- Name: `planetary-agents-frontend`
- Build: `yarn install && npx prisma generate && yarn build`
- Start: `yarn start`
- Health Check: `/api/health`
- Add environment variables from Step 2 above

**Backend:**
- Type: Web Service
- Name: `planetary-agents-backend`
- Root Directory: `backend`
- Build: `yarn install && npx prisma generate && yarn build`
- Start: `yarn start`
- Health Check: `/api/health`
- Add environment variables from Step 2 above

## ✅ Step 3: Verify (3 min)

Wait for both services to deploy (~5-10 min), then test:

```bash
# 1. Frontend health
curl https://YOUR-FRONTEND.onrender.com/api/health

# Expected: {"status": "healthy", ...}

# 2. Backend health
curl https://YOUR-BACKEND.onrender.com/api/health

# Expected: {"status": "operational", ...}

# 3. Homepage loads
curl https://YOUR-FRONTEND.onrender.com

# Should return HTML with status 200

# 4. Test API endpoint
curl -X POST https://YOUR-FRONTEND.onrender.com/api/celestial-energy-timeline \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-01T00:00:00Z","endDate":"2025-01-01T23:59:59Z","interval":"hour","metrics":["A#"]}'

# Should return JSON data
```

## 🎉 Success!

Your app is now live at: `https://YOUR-FRONTEND.onrender.com`

## 🔧 Common Issues

### "Unhealthy" Status

**Solution:** Check logs in Render dashboard:
- Frontend → Logs tab
- Look for Prisma connection errors
- Verify DATABASE_URL is correct and database is active

### Build Timeout

**Solution:** Free tier builds are slower. If it times out:
1. Push a small change to trigger rebuild
2. Or manually redeploy
3. Build should complete in 5-10 minutes

### Database Connection Error

**Solutions:**
1. Verify DATABASE_URL format has `?sslmode=require`
2. Use **pooled** connection string from Neon (not direct)
3. Check Neon database isn't suspended (free tier can sleep)
4. Wake up database: Run `npx prisma db pull` locally

### CORS Error

**Solution:** Backend CORS_ORIGINS must exactly match frontend URL:
```bash
# Correct:
CORS_ORIGINS=https://planetary-agents-frontend.onrender.com

# Wrong (don't include these):
CORS_ORIGINS=https://planetary-agents-frontend.onrender.com/  # No trailing slash
CORS_ORIGINS=http://...  # Must be https://
```

## 📈 Next Steps

After successful deployment:

1. **Test Agent Chat**:
   - Visit: `https://YOUR-FRONTEND.onrender.com/gallery`
   - Click on any agent
   - Send a test message

2. **Enable Backend Features** (optional):
   - Go to Frontend → Environment
   - Set: `NEXT_PUBLIC_PLANETARY_HOURS_BACKEND=true`
   - Redeploy
   - Verify still works
   - Gradually enable other features

3. **Monitor**:
   - Check logs regularly for errors
   - Free tier sleeps after 15 min inactivity
   - First request after sleep takes ~30-60 sec

4. **Update Code**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   # Render auto-deploys on push
   ```

## 💰 Cost

- **Total: $0** (all free tiers)
- Render: 750 hours/month (enough for 2 services)
- Neon: 3 GB database (enough for development)

## 📚 More Info

- Full guide: `RENDER_DEPLOYMENT.md`
- Environment variables: `.env.render.template`
- Troubleshooting: Check service logs in Render dashboard
- Re-deployment: Just `git push origin main`

---

**Need Help?**
- Check Render service logs first
- Verify all environment variables are set
- Test database connection: `npx prisma db pull`
- Ensure OpenAI API key has credits
