# Render Deployment - Changes Summary

## What Changed

### New Files Created

1. **`render.yaml`** - Blueprint for automatic Render deployment
   - Configures frontend (Next.js) service
   - Configures backend (Express) service
   - Links services together with environment variables
   - Free-tier optimized settings

2. **`RENDER_DEPLOYMENT.md`** - Complete deployment guide
   - Step-by-step instructions for manual and automatic deployment
   - Database setup (Neon/Supabase)
   - Environment variable configuration
   - Troubleshooting section
   - ~30 minute read

3. **`RENDER_QUICK_START.md`** - 15-minute quick start guide
   - Minimal steps to get deployed
   - Focuses on fastest path to production
   - Common issues and solutions
   - ~5 minute read

4. **`.env.render.template`** - Environment variables template
   - All required and optional variables
   - Detailed comments explaining each variable
   - Copy-paste ready for Render dashboard
   - Separate sections for frontend and backend

5. **`scripts/verify-render-build.sh`** - Pre-deployment verification script
   - Checks Node/Yarn versions
   - Tests local builds
   - Verifies database connection
   - Catches errors before deploying

6. **`VERCEL_ENV_CHECKLIST.md`** (from previous work)
   - Also useful for Render deployment
   - Lists all environment variables

### Existing Files Modified

None - All changes are additive, no existing code modified.

## How to Deploy

### Quick Method (15 minutes)

```bash
# 1. Create Neon database and get connection string
#    https://neon.tech → Create Project → Copy pooled connection string

# 2. Run migrations
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy

# 3. Push to Git
git add .
git commit -m "Add Render deployment configuration"
git push origin main

# 4. Deploy to Render
#    - Go to render.com → New Blueprint
#    - Connect repository
#    - Set environment variables (see .env.render.template)
#    - Deploy

# 5. Verify
curl https://YOUR-FRONTEND.onrender.com/api/health
```

### Detailed Method

Follow `RENDER_QUICK_START.md` or `RENDER_DEPLOYMENT.md`

## Configuration Highlights

### Frontend Service
- **Build:** `yarn install && npx prisma generate && yarn build`
- **Start:** `yarn start`
- **Port:** 3000 (default Next.js)
- **Health Check:** `/api/health`
- **Free Tier:** ✅ Yes

### Backend Service
- **Root Directory:** `backend`
- **Build:** `yarn install && npx prisma generate && yarn build`
- **Start:** `yarn start`
- **Port:** 8000
- **Health Check:** `/api/health`
- **Free Tier:** ✅ Yes

### Database
- **Provider:** Neon.tech (recommended) or Supabase
- **Type:** PostgreSQL
- **Free Tier:** ✅ 3 GB storage
- **Connection:** Pooled connection string recommended

### Feature Toggles

Initially disabled for faster health checks:
```bash
NEXT_PUBLIC_PLANETARY_HOURS_BACKEND=false
NEXT_PUBLIC_THERMODYNAMICS_BACKEND=false
NEXT_PUBLIC_TOKEN_CALCULATIONS_BACKEND=false
NEXT_PUBLIC_KINETICS_BACKEND=false
```

Enable gradually after successful deployment.

## Environment Variables Required

### Frontend (Minimum)
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://your-frontend.onrender.com
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ADDITIVE_ONLY_ELEMENTS=true
```

### Backend (Minimum)
```bash
DATABASE_URL=postgresql://...
PORT=8000
CORS_ORIGINS=https://your-frontend.onrender.com
```

See `.env.render.template` for full list.

## Testing & Verification

### Health Checks

```bash
# Frontend
curl https://YOUR-FRONTEND.onrender.com/api/health
# Expected: {"status":"healthy","service":"planetary-agents-frontend",...}

# Backend
curl https://YOUR-BACKEND.onrender.com/api/health
# Expected: {"status":"operational","version":"1.0.0",...}
```

### Smoke Tests

```bash
# 1. Homepage loads
curl https://YOUR-FRONTEND.onrender.com
# Should return HTML

# 2. API endpoint works
curl -X POST https://YOUR-FRONTEND.onrender.com/api/celestial-energy-timeline \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-01T00:00:00Z","endDate":"2025-01-01T23:59:59Z","interval":"hour","metrics":["A#"]}'
# Should return JSON with energy data

# 3. Agent functionality (if OpenAI key is set)
# Visit: https://YOUR-FRONTEND.onrender.com/gallery
# Click an agent and test chat
```

## Performance Expectations

### Free Tier Limitations
- Services **sleep after 15 minutes** of inactivity
- **30-60 second wake-up** time on first request
- 512 MB RAM per service
- Shared CPU (builds take 5-10 minutes)

### Response Times (After Wake-up)
- Health checks: < 200ms
- API endpoints: < 500ms (target)
- AI responses: 1-3 seconds (depends on OpenAI)
- Page loads: 1-2 seconds

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Build fails | Check logs, verify `yarn.lock` committed |
| Health check fails | Verify DATABASE_URL, check service logs |
| Database connection error | Use pooled connection string, check SSL mode |
| CORS errors | Verify CORS_ORIGINS matches frontend URL exactly |
| OpenAI errors | Check API key and billing |
| Service sleeps | Normal on free tier, wakes on request |

## Re-deployment

### After Code Changes
```bash
git add .
git commit -m "Your changes"
git push origin main
# Render auto-deploys on push
```

### After Environment Variable Changes
1. Update in Render dashboard → Service → Environment
2. Click "Manual Deploy" → "Deploy latest commit"

### After Database Schema Changes
```bash
# 1. Create migration locally
npx prisma migrate dev --name your_migration

# 2. Deploy migration
export DATABASE_URL="your-neon-url"
npx prisma migrate deploy

# 3. Redeploy services (to regenerate Prisma client)
```

## Cost Breakdown

- **Render Free Tier:** 750 hours/month per service
  - Frontend: ~375 hours (enough for 24/7 + sleep time)
  - Backend: ~375 hours (enough for 24/7 + sleep time)
- **Neon Free Tier:** 3 GB storage, unlimited queries
- **OpenAI:** Pay per usage (varies)
- **Total Infrastructure:** **$0/month**

## Next Steps After Deployment

1. ✅ Verify all health checks pass
2. ✅ Test basic functionality (homepage, API, chat)
3. 🔧 Enable backend features gradually
4. 📊 Monitor logs for errors
5. 🚀 Set up custom domain (optional, Render free)
6. 📈 Consider UptimeRobot for keep-alive pings
7. 💰 Upgrade to paid plan if performance is critical

## Support Resources

- **Render Docs:** https://render.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Project Guides:**
  - Quick Start: `RENDER_QUICK_START.md`
  - Full Guide: `RENDER_DEPLOYMENT.md`
  - Variables: `.env.render.template`
- **Logs:** Always check service logs in Render dashboard

## Files Reference

```
planetary-agents/
├── render.yaml                    # Render blueprint (automatic deployment)
├── RENDER_DEPLOYMENT.md           # Complete deployment guide
├── RENDER_QUICK_START.md          # 15-minute quick start
├── RENDER_CHANGES_SUMMARY.md      # This file
├── .env.render.template           # Environment variables template
├── scripts/
│   └── verify-render-build.sh    # Pre-deployment verification
├── app/api/health/route.ts        # Frontend health check
└── backend/
    ├── src/routes/health.ts       # Backend health check
    ├── package.json               # Backend dependencies
    └── prisma/schema.prisma       # Backend database schema
```

## Success Criteria Checklist

- [ ] Frontend service deployed and healthy
- [ ] Backend service deployed and healthy
- [ ] Database connected (Neon/Supabase)
- [ ] `GET /` returns homepage (200)
- [ ] `GET /api/health` returns healthy status (200)
- [ ] `POST /api/celestial-energy-timeline` returns data (200)
- [ ] No CORS errors in browser console
- [ ] Agent chat works (if OpenAI key set)
- [ ] Services auto-deploy on git push
- [ ] Health checks remain green for 24+ hours

---

**Deployment Status:** Ready to deploy
**Estimated Time:** 15-30 minutes
**Total Cost:** $0 (free tier)
**Last Updated:** 2025-01-29
