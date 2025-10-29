# Render Deployment Guide - Planetary Agents

**Goal:** Deploy Next.js frontend + Express backend on Render free tier with PostgreSQL database.

## Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com) (free)
2. **Neon Database** - Free PostgreSQL at [neon.tech](https://neon.tech) (recommended)
   - Alternative: [Supabase](https://supabase.com) (also free)
3. **API Keys**
   - OpenAI API key with credits
   - Anthropic API key (optional)

## Quick Start (Using render.yaml)

### Option A: Automatic Deployment (Recommended)

1. **Fork/Connect Repository**
   - Go to Render Dashboard → New → Blueprint
   - Connect your Git repository
   - Render will detect `render.yaml` and create both services

2. **Set Environment Variables**
   - After blueprint creates services, go to each service's Environment tab
   - Set the following variables marked as `sync: false`:

   **Frontend Service:**
   ```bash
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=https://YOUR-FRONTEND.onrender.com
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-... # optional
   ```

   **Backend Service:**
   ```bash
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   CORS_ORIGINS=https://YOUR-FRONTEND.onrender.com
   ```

3. **Run Database Migrations**
   ```bash
   # From your local machine with DATABASE_URL from Neon
   export DATABASE_URL="postgresql://..."
   npx prisma migrate deploy
   ```

4. **Trigger Redeployment**
   - Go to each service → Manual Deploy → Deploy latest commit

### Option B: Manual Service Creation

If automatic blueprint doesn't work, create services manually:

#### 1. Create Frontend Service

- **Type:** Web Service
- **Name:** planetary-agents-frontend
- **Runtime:** Node
- **Region:** Oregon (or closest to you)
- **Branch:** main
- **Build Command:** `yarn install && npx prisma generate && yarn build`
- **Start Command:** `yarn start`
- **Plan:** Free
- **Health Check Path:** `/api/health`

**Environment Variables:**
```bash
NODE_ENV=production
NODE_VERSION=20.11.0
NEXT_PUBLIC_ADDITIVE_ONLY_ELEMENTS=true
DATABASE_URL=<neon-connection-string>
NEXTAUTH_SECRET=<generate-with-openssl-rand>
NEXTAUTH_URL=https://<your-frontend>.onrender.com
OPENAI_API_KEY=sk-...
GALILEO_FAIL_SILENTLY=true
GALILEO_LOG_ENABLED=false
# Backend integration - add after backend is created
NEXT_PUBLIC_BACKEND_URL=https://<your-backend>.onrender.com
```

#### 2. Create Backend Service

- **Type:** Web Service
- **Name:** planetary-agents-backend
- **Runtime:** Node
- **Region:** Oregon (same as frontend)
- **Branch:** main
- **Root Directory:** `backend`
- **Build Command:** `yarn install && npx prisma generate && yarn build`
- **Start Command:** `yarn start`
- **Plan:** Free
- **Health Check Path:** `/api/health`

**Environment Variables:**
```bash
NODE_ENV=production
NODE_VERSION=20.11.0
PORT=8000
HOST=0.0.0.0
DATABASE_URL=<same-as-frontend>
CORS_ORIGINS=https://<your-frontend>.onrender.com
ENABLE_WEBSOCKET=false
PLANETARY_HOURS_BACKEND=false
THERMODYNAMICS_BACKEND=false
TOKEN_CALCULATIONS_BACKEND=false
KINETICS_BACKEND=false
```

## Database Setup (Neon.tech)

1. **Create Database**
   ```bash
   # Go to neon.tech → Create Project
   # Name: planetary-agents
   # Region: Choose closest to your Render region
   ```

2. **Get Connection String**
   ```bash
   # Use POOLED connection string for better performance
   # Format: postgresql://user:pass@ep-xxx.region.aws.neon.tech/main?sslmode=require
   ```

3. **Run Migrations**
   ```bash
   # From local machine
   export DATABASE_URL="<your-neon-pooled-connection-string>"
   cd planetary-agents
   yarn install
   npx prisma migrate deploy

   # Verify
   npx prisma db pull
   ```

## Environment Variables Reference

### Required (Frontend)
- `DATABASE_URL` - PostgreSQL connection string from Neon/Supabase
- `NEXTAUTH_URL` - Your frontend URL: `https://planetary-agents-frontend.onrender.com`
- `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_ADDITIVE_ONLY_ELEMENTS` - Set to `true`

### Required (Backend)
- `DATABASE_URL` - Same as frontend
- `PORT` - `8000` (default)
- `CORS_ORIGINS` - Frontend URL: `https://planetary-agents-frontend.onrender.com`

### Optional
- `ANTHROPIC_API_KEY` - For Claude models
- `NEXT_PUBLIC_BACKEND_URL` - Backend URL (auto-linked in render.yaml)
- `REDIS_URL` - For Redis caching (uses memory fallback if not set)
- `GALILEO_API_KEY` - For observability (optional)

### Feature Flags (Start Disabled)
Start with these as `false`, enable after initial deployment succeeds:
- `NEXT_PUBLIC_PLANETARY_HOURS_BACKEND=false`
- `NEXT_PUBLIC_THERMODYNAMICS_BACKEND=false`
- `NEXT_PUBLIC_TOKEN_CALCULATIONS_BACKEND=false`
- `NEXT_PUBLIC_KINETICS_BACKEND=false`

## Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend health
curl https://YOUR-FRONTEND.onrender.com/api/health

# Expected: { "status": "healthy", ... }

# Backend health
curl https://YOUR-BACKEND.onrender.com/api/health

# Expected: { "status": "operational", ... }
```

### 2. Smoke Tests

```bash
# Test homepage
curl https://YOUR-FRONTEND.onrender.com
# Should return HTML with status 200

# Test celestial energy endpoint
curl -X POST https://YOUR-FRONTEND.onrender.com/api/celestial-energy-timeline \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-01T23:59:59Z",
    "interval": "hour",
    "metrics": ["A#", "SMES"]
  }'

# Should return JSON with energy data
```

### 3. Check Logs

```bash
# In Render Dashboard:
# Frontend Service → Logs tab → Check for errors
# Backend Service → Logs tab → Check for errors

# Look for:
# ✓ "Server listening on port 8000"
# ✓ "Prisma client generated"
# ✓ No connection errors
```

## Troubleshooting

### Build Fails

**Problem:** "Cannot find module 'prisma'"
```bash
# Solution: Prisma is in devDependencies, need to generate during build
# Ensure buildCommand includes: npx prisma generate
```

**Problem:** "Heap out of memory"
```bash
# Solution: Add to frontend environment variables
NODE_OPTIONS=--max-old-space-size=2048
```

### Database Connection Fails

**Problem:** "Can't reach database server"
```bash
# Solution 1: Use pooled connection string from Neon
# Solution 2: Add ?sslmode=require to connection string
# Solution 3: Check if DATABASE_URL is set in both services
# Solution 4: Verify Neon database is not suspended (free tier sleeps)
```

### Health Check Fails

**Problem:** Service shows "Unhealthy"
```bash
# Solution 1: Verify health check path is /api/health
# Solution 2: Check that service started successfully in logs
# Solution 3: Temporarily disable backend health check in frontend
# Edit app/api/health/route.ts to skip backend check
```

### CORS Errors

**Problem:** "Access-Control-Allow-Origin error"
```bash
# Solution: Update backend CORS_ORIGINS to include exact frontend URL
# Backend env: CORS_ORIGINS=https://planetary-agents-frontend.onrender.com
# No trailing slash!
```

### OpenAI API Errors

**Problem:** "Insufficient quota"
```bash
# Solution 1: Verify API key is correct and has credits
# Solution 2: Check OpenAI account billing at platform.openai.com
# Solution 3: For testing, stub AI responses in health checks
```

### Free Tier Limitations

**Issue:** Services spin down after 15 minutes of inactivity
```bash
# Solution: This is expected on free tier
# Services wake up on first request (may take 30-60 seconds)
# Consider UptimeRobot or similar for keep-alive pings
```

**Issue:** Build times out
```bash
# Solution 1: Remove unused dependencies
# Solution 2: Use yarn cache
# Solution 3: Split builds (build backend separately if needed)
```

## Re-deployment Process

### After Code Changes

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Auto-Deploy**
   - Render will automatically detect changes and redeploy
   - Or manually trigger: Dashboard → Service → Manual Deploy

### After Environment Variable Changes

1. **Update Variables**
   - Go to Service → Environment
   - Add/modify variables
   - Click "Save Changes"

2. **Redeploy**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or wait for next git push (auto-deploy)

### Database Schema Changes

1. **Create Migration Locally**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Deploy Migration**
   ```bash
   export DATABASE_URL="<your-neon-url>"
   npx prisma migrate deploy
   ```

3. **Redeploy Services**
   - Both services will pick up new schema on next deploy

## Performance Optimization

### Enable Backend Features (After Initial Success)

Once health checks pass, gradually enable backend features:

```bash
# In Frontend Environment:
NEXT_PUBLIC_PLANETARY_HOURS_BACKEND=true
NEXT_PUBLIC_THERMODYNAMICS_BACKEND=true

# Redeploy and test
# If successful, enable more:
NEXT_PUBLIC_TOKEN_CALCULATIONS_BACKEND=true
NEXT_PUBLIC_KINETICS_BACKEND=true
```

### Add Redis (Optional)

For better caching performance:

1. Use external Redis provider (e.g., Upstash free tier)
2. Add REDIS_URL to backend environment
3. Backend will automatically use Redis instead of memory cache

### Monitor Performance

```bash
# Check response times in health endpoint
curl https://YOUR-FRONTEND.onrender.com/api/health | jq .

# Backend performance
curl https://YOUR-BACKEND.onrender.com/api/health/detailed | jq .
```

## Cost Considerations

- **Render Free Tier:** 750 hours/month per service (enough for 2 services)
- **Neon Free Tier:** 3 GB storage, 0.5 GB RAM (sufficient for development)
- **Limitations:**
  - Services spin down after 15 min inactivity
  - 512 MB RAM per service
  - Shared CPU

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Project Issues:** Check repository README for troubleshooting
- **Logs:** Always check service logs in Render dashboard for errors

## Success Criteria

✅ Frontend service showing "Healthy" status
✅ Backend service showing "Healthy" status
✅ `GET /` returns homepage (200)
✅ `GET /api/health` returns `{"status": "healthy"}` (200)
✅ `POST /api/celestial-energy-timeline` returns data (200)
✅ Database queries work (check health endpoint)
✅ No CORS errors in browser console
✅ Agent chat functionality works

---

**Deployment Time:** ~15-30 minutes (including database setup)
**Cost:** $0 (free tier)
**Maintenance:** Auto-deploys on git push
