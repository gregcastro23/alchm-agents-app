# 🚀 Backend Quick Start Guide

## One-Command Startup

Start the backend server:

```bash
./backend/scripts/start-production.sh
```

This script will:

- ✅ Start the backend on port 8000
- ✅ Display backend URL
- ✅ Auto-restart if it crashes
- ✅ Clean shutdown with Ctrl+C

---

## Individual Components

### Start Backend Only

```bash
cd backend
yarn dev
```

### For Production Deployment

See `BACKEND_DEPLOYMENT_GUIDE.md` for deploying to Render or Railway.

---

## Monitoring & Testing

### Real-Time Dashboard

```bash
./backend/scripts/monitoring-dashboard.sh
```

Shows:

- Backend service status
- API endpoints health
- Connection metrics
- Performance statistics

### Test All Endpoints

```bash
./backend/scripts/test-endpoints.sh
```

Tests all API endpoints and shows pass/fail results.

---

## Production URLs

**Live Site**: https://v0-planetary-agents1.vercel.app

**Backend (Local Development)**:
- URL: `http://localhost:8000`
- Health: `http://localhost:8000/api/health`

**Backend (Production)**:
- Deploy to Render/Railway (see `BACKEND_DEPLOYMENT_GUIDE.md`)
- Set `NEXT_PUBLIC_BACKEND_URL` in Vercel environment variables

---

## Logs

```bash
# Backend logs
tail -f backend/logs/backend.log

# All logs
tail -f backend/logs/*.log
```

---

## Stop Services

### Stop All (if started with start-production.sh)

Press `Ctrl+C` in the terminal running the script.

### Stop Individual Services

```bash
# Stop backend
pkill -f "tsx src/index.ts"
```

---

## Troubleshooting

### Port 8000 Already in Use

```bash
# Find and kill process
lsof -i:8000
kill -9 <PID>
```

### Backend Not Starting

1. Check dependencies: `cd backend && yarn install`
2. Check logs: `tail -f backend/logs/backend.log`
3. Verify environment variables are set

### Vercel Site Not Connecting to Backend

1. **For local development**: Backend must be running on `localhost:8000`
2. **For production**: Deploy backend to Render/Railway and set `NEXT_PUBLIC_BACKEND_URL` in Vercel
3. Check CORS configuration in `backend/src/index.ts`
4. Ensure backend is healthy: `curl http://localhost:8000/api/health`

---

## Quick Commands Cheat Sheet

```bash
# Start backend
./backend/scripts/start-production.sh

# Monitor dashboard
./backend/scripts/monitoring-dashboard.sh

# Test endpoints
./backend/scripts/test-endpoints.sh

# Check backend health
curl http://localhost:8000/api/health

# View logs
tail -f backend/logs/backend.log

# Stop backend
pkill -f "tsx src/index.ts"
```

---

## Deployment

For production deployment, see:
- **BACKEND_DEPLOYMENT_GUIDE.md** - Step-by-step Render/Railway deployment
- **PRODUCTION_SCALING_GUIDE.md** - Scaling and optimization guide

---

For complete documentation, see [BACKEND_DEPLOYMENT_GUIDE.md](../BACKEND_DEPLOYMENT_GUIDE.md)
