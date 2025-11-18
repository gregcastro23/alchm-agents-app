# Render Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Status
- [x] All changes committed
- [x] Code pushed to branch: `render-deployment`
- [x] Health endpoint configured: `/api/health`
- [x] Build scripts ready in `backend/package.json`

### Repository
- **GitHub/GitLab URL**: `git@gitlab.com:xalchm/planetary_agents.git`
- **Branch to deploy**: `render-deployment`
- **Root directory**: `backend`

---

## 🚀 Render Service Configuration

### Basic Settings (in Render Dashboard)

Navigate to: https://dashboard.render.com/w/tea-d385deje5dus739tdk00/settings

**Service Settings:**
```
Name: planetary-agents-backend
Region: Oregon (US West)
Branch: render-deployment
Root Directory: backend
Runtime: Node
Build Command: yarn install && npx prisma generate && yarn build
Start Command: node dist/index.js
```

**Health Check:**
```
Health Check Path: /api/health
```

**Auto Deploy:**
```
✅ Enable auto-deploy from branch
```

---

## 🔐 Environment Variables to Set

### Core Configuration

```bash
# Node Environment
NODE_ENV=production
NODE_VERSION=20.11.0
PORT=8000
HOST=0.0.0.0
```

### Database (Neon PostgreSQL)

```bash
# Your existing Neon database URL
DATABASE_URL=postgresql://neondb_owner:npg_J8CabeXrf5Od@ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### CORS Configuration

```bash
# Your Vercel frontend URLs
CORS_ORIGINS=https://v0-planetary-agents1.vercel.app,https://v0-planetary-agents-git-main-gregcastro23s-projects.vercel.app,https://*.vercel.app
```

### Feature Flags

**Start with these DISABLED (set to false) for initial deployment:**
```bash
PLANETARY_HOURS_BACKEND=false
THERMODYNAMICS_BACKEND=false
TOKEN_CALCULATIONS_BACKEND=false
KINETICS_BACKEND=false
```

**Enable later after deployment succeeds:**
```bash
# Change to true after successful deployment
PLANETARY_HOURS_BACKEND=true
THERMODYNAMICS_BACKEND=true
TOKEN_CALCULATIONS_BACKEND=true
KINETICS_BACKEND=true
```

### WebSocket (Disable for Free Tier)

```bash
ENABLE_WEBSOCKET=false
```

### External Services

```bash
# Alchm Backend Integration
ALCHM_BACKEND_URL=https://alchm-backend.onrender.com
ALCHM_BACKEND_TIMEOUT=30000
```

### AI API Keys (Same as Vercel)

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Redis (Optional - Leave blank for memory fallback)

```bash
# Leave empty to use memory cache instead
# REDIS_URL=redis://your-redis-url:6379
```

---

## 📋 Step-by-Step Deployment

### Step 1: Create Web Service in Render

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitLab** account if not already connected
4. Select repository: `xalchm/planetary_agents`
5. Click **"Connect"**

### Step 2: Configure Service

Fill in the following:

**Name:** `planetary-agents-backend`

**Region:** `Oregon (US West)`

**Branch:** `render-deployment`

**Root Directory:** `backend`

**Runtime:** `Node`

**Build Command:**
```bash
yarn install && npx prisma generate && yarn build
```

**Start Command:**
```bash
node dist/index.js
```

**Plan:** `Free` (or upgrade to `Starter` for $7/month - no sleep mode)

### Step 3: Set Environment Variables

Click on **"Environment"** tab and add all variables from the section above.

**Quick Copy-Paste:**

```
NODE_ENV=production
NODE_VERSION=20.11.0
PORT=8000
HOST=0.0.0.0
DATABASE_URL=postgresql://neondb_owner:npg_J8CabeXrf5Od@ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
CORS_ORIGINS=https://v0-planetary-agents1.vercel.app,https://v0-planetary-agents-git-main-gregcastro23s-projects.vercel.app
PLANETARY_HOURS_BACKEND=false
THERMODYNAMICS_BACKEND=false
TOKEN_CALCULATIONS_BACKEND=false
KINETICS_BACKEND=false
ENABLE_WEBSOCKET=false
ALCHM_BACKEND_URL=https://alchm-backend.onrender.com
ALCHM_BACKEND_TIMEOUT=30000
```

**Add your API keys separately (don't commit these!):**
```
ANTHROPIC_API_KEY=<your_key>
OPENAI_API_KEY=<your_key>
```

### Step 4: Configure Health Check

In **"Settings"** → **"Health Check"**:

```
Health Check Path: /api/health
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Watch the logs for any errors
4. Wait 5-10 minutes for first deployment

---

## ✅ Post-Deployment Verification

### Get Your Backend URL

After deployment completes, Render will provide a URL like:
```
https://planetary-agents-backend.onrender.com
```

or

```
https://planetary-agents-backend-<random-id>.onrender.com
```

**Save this URL!** You'll need it for the frontend.

### Test Health Endpoint

```bash
# Replace with your actual Render URL
curl https://planetary-agents-backend.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "operational",
  "timestamp": "2025-11-18T...",
  "uptime": 123.45,
  "responseTime": 50,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "alchmBackend": {
      "healthy": true,
      "responseTime": 200
    },
    "cache": {
      "type": "memory",
      "connected": true
    }
  },
  "featureFlags": {
    "planetaryHoursBackend": false,
    "thermodynamicsBackend": false,
    "tokenCalculationsBackend": false,
    "kineticsBackend": false
  }
}
```

### Test API Endpoints

```bash
# Test planetary hours
curl -X POST https://planetary-agents-backend.onrender.com/api/planetary/current-hour \
  -H "Content-Type: application/json" \
  -d '{"location":{"lat":40.7128,"lon":-74.0060}}'

# Test alchemy endpoints
curl https://planetary-agents-backend.onrender.com/api/alchemy/elements
```

---

## 🔧 Update Vercel Frontend

Once backend is deployed successfully:

### 1. Get Backend URL

Copy your Render backend URL from the dashboard.

### 2. Update Vercel Environment Variables

Go to: https://vercel.com/your-project/settings/environment-variables

**Remove old variables:**
- Delete `NEXT_PUBLIC_BACKEND_URL` (if pointing to ngrok)
- Delete `NEXT_PUBLIC_WEBSOCKET_URL` (if pointing to ngrok)

**Add new variables:**

```bash
# Your new Render backend URL
NEXT_PUBLIC_BACKEND_URL=https://planetary-agents-backend.onrender.com

# WebSocket (only if enabled)
# NEXT_PUBLIC_WEBSOCKET_URL=wss://planetary-agents-backend.onrender.com

# Feature flags (match backend settings)
NEXT_PUBLIC_PLANETARY_HOURS_BACKEND=false
NEXT_PUBLIC_THERMODYNAMICS_BACKEND=false
NEXT_PUBLIC_TOKEN_CALCULATIONS_BACKEND=false
NEXT_PUBLIC_KINETICS_BACKEND=false
```

### 3. Redeploy Frontend

**Via Dashboard:**
1. Go to Vercel Deployments
2. Click latest deployment
3. Click **"..."** → **"Redeploy"**

**Via CLI:**
```bash
vercel --prod
```

---

## 🎯 Enable Features Gradually

After initial deployment succeeds, enable features one at a time:

### Phase 1: Core Features (Week 1)
```bash
PLANETARY_HOURS_BACKEND=true
```
- Test planetary hours endpoint
- Monitor logs for errors
- Verify frontend integration

### Phase 2: Calculations (Week 2)
```bash
THERMODYNAMICS_BACKEND=true
TOKEN_CALCULATIONS_BACKEND=true
```
- Test calculation endpoints
- Check response times
- Monitor memory usage

### Phase 3: Advanced Features (Week 3)
```bash
KINETICS_BACKEND=true
```
- Test agent kinetics
- Verify consciousness calculations
- Monitor overall performance

---

## 🐛 Troubleshooting

### Build Fails

**Check Render logs for:**
- Missing dependencies in `package.json`
- TypeScript compilation errors
- Prisma generation failures

**Common fixes:**
```bash
# Ensure all dependencies are installed
yarn install

# Check build locally
cd backend && yarn build

# Verify Prisma schema
npx prisma validate
```

### Service Won't Start

**Check for:**
- Port binding issues (ensure `PORT` and `HOST` are set)
- Missing environment variables
- Database connection errors

**Logs to check:**
```
Starting server on 0.0.0.0:8000
✓ Cache service initialized
✓ External services configured
✓ Server started successfully
```

### Health Check Fails

**Verify:**
1. `/api/health` endpoint returns 200 OK
2. Health check path in Render matches `/api/health`
3. No authentication required for health endpoint

**Test locally:**
```bash
cd backend
yarn dev
curl http://localhost:8000/api/health
```

### CORS Errors

**Check:**
1. Frontend URL is in `CORS_ORIGINS` environment variable
2. CORS includes wildcards for preview deployments
3. No typos in URLs

**Update CORS_ORIGINS:**
```bash
CORS_ORIGINS=https://v0-planetary-agents1.vercel.app,https://*.vercel.app,http://localhost:3000
```

### 503 Service Unavailable

**Free tier limitation:**
- Service sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up

**Solutions:**
1. Wait 60 seconds and retry
2. Upgrade to paid tier ($7/month - no sleep)
3. Use Railway instead (better free tier)

---

## 💡 Performance Tips

### Free Tier Optimizations

1. **Minimize cold starts:**
   - Keep response times under 200ms
   - Cache aggressively with Redis or memory
   - Reduce dependencies in build

2. **Monitor usage:**
   - Check Render dashboard for bandwidth
   - Review logs for errors
   - Track response times

3. **Consider paid tier if:**
   - You need 24/7 uptime
   - Cold starts are problematic
   - Free tier bandwidth is insufficient

### Upgrade to Starter ($7/month)

**Benefits:**
- ✅ No sleep mode (instant responses)
- ✅ Faster cold starts
- ✅ More bandwidth
- ✅ Priority support
- ✅ Custom domains

---

## 📊 Monitoring

### Render Dashboard

Monitor in real-time:
- CPU usage
- Memory consumption
- Request volume
- Error rates
- Deployment history

### Logs

Access via:
1. Render Dashboard → Your Service → Logs
2. Filter by: Info, Warn, Error
3. Search for specific errors or patterns

### Alerts (Paid Plans)

Set up alerts for:
- Service downtime
- High error rates
- Memory/CPU spikes
- Deployment failures

---

## 🎉 Success Criteria

✅ **Deployment Successful When:**

1. Render service shows "Live" status
2. Health endpoint returns 200 OK
3. No errors in deployment logs
4. API endpoints respond correctly
5. Frontend can call backend APIs
6. No CORS errors in browser console

✅ **Production Ready When:**

1. All feature flags enabled and tested
2. Frontend fully integrated
3. No 500 errors in last 24 hours
4. Response times under 500ms
5. Memory usage stable
6. External service integrations working

---

## 📞 Support Resources

**Render:**
- Docs: https://render.com/docs
- Support: support@render.com
- Status: https://status.render.com

**Database (Neon):**
- Dashboard: https://console.neon.tech
- Docs: https://neon.tech/docs

**Frontend (Vercel):**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

---

## 🔄 Next Steps After Deployment

1. **Monitor for 24 hours** - Check logs for any errors
2. **Test all endpoints** - Verify full functionality
3. **Enable features gradually** - One at a time
4. **Update documentation** - Record your Render URL
5. **Set up monitoring** - Consider external uptime monitoring
6. **Plan for scale** - Upgrade if needed

---

**Deployment Date:** 2025-11-18
**Backend URL:** _To be filled after deployment_
**Status:** Ready to deploy! 🚀
