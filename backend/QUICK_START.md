# 🚀 Backend Quick Start Guide

## One-Command Startup

Start everything (backend + ngrok + monitoring):

```bash
./backend/scripts/start-production.sh
```

This script will:

- ✅ Start the backend on port 8000
- ✅ Start ngrok tunnel
- ✅ Display tunnel URL
- ✅ Check Vercel sync status
- ✅ Auto-restart services if they crash
- ✅ Clean shutdown with Ctrl+C

---

## Individual Components

### Start Backend Only

```bash
cd backend
yarn dev
```

### Start ngrok Only

```bash
ngrok http 8000
```

### Start ngrok with Auto-Restart

```bash
./backend/scripts/start-ngrok-persistent.sh
```

---

## Monitoring & Testing

### Real-Time Dashboard

```bash
./backend/scripts/monitoring-dashboard.sh
```

Shows:

- Backend service status
- ngrok tunnel health
- API endpoints
- Vercel integration status
- Connection metrics

### Health Check Only

```bash
./backend/scripts/monitor-ngrok-health.sh
```

### Test All Endpoints

```bash
./backend/scripts/test-endpoints.sh
```

Tests all 12 API endpoints and shows pass/fail results.

---

## Production URLs

**Live Site**: https://v0-planetary-agents1.vercel.app

**Backend (via ngrok)**: Check dashboard or run:

```bash
curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*'
```

**Health Check**:

```bash
curl -H "ngrok-skip-browser-warning: true" \
  https://YOUR-NGROK-URL.ngrok-free.dev/api/health
```

---

## Update Vercel After ngrok Restart

If ngrok URL changes (free tier):

```bash
# Get new URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4)

# Update Vercel
echo "$NGROK_URL" | vercel env add NEXT_PUBLIC_BACKEND_URL production

# Redeploy
vercel --prod
```

---

## Logs

```bash
# Backend logs
tail -f backend/logs/backend.log

# ngrok logs
tail -f backend/logs/ngrok.log

# Both
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

# Stop ngrok
pkill ngrok
```

---

## Troubleshooting

### Port 8000 Already in Use

```bash
# Find and kill process
lsof -i:8000
kill -9 <PID>
```

### ngrok Not Connecting

1. Check if backend is running: `lsof -i:8000`
2. Restart ngrok: `pkill ngrok && ngrok http 8000`
3. Check ngrok dashboard: http://127.0.0.1:4040

### Vercel Site Not Connecting to Backend

1. Verify ngrok URL matches Vercel env var
2. Check CORS configuration in `backend/src/index.ts`
3. Ensure backend is healthy: `curl http://localhost:8000/api/health`

---

## Quick Commands Cheat Sheet

```bash
# Start everything
./backend/scripts/start-production.sh

# Monitor dashboard
./backend/scripts/monitoring-dashboard.sh

# Test endpoints
./backend/scripts/test-endpoints.sh

# Get ngrok URL
curl -s http://127.0.0.1:4040/api/tunnels | grep public_url

# Check backend health
curl http://localhost:8000/api/health

# View logs
tail -f backend/logs/backend.log

# Stop everything
pkill -f "tsx src/index.ts" && pkill ngrok
```

---

For complete documentation, see [NGROK_BACKEND_INTEGRATION_COMPLETE.md](../NGROK_BACKEND_INTEGRATION_COMPLETE.md)
