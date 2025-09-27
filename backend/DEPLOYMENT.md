# 🚀 Planetary Agents Backend - Deployment Guide

This guide provides step-by-step instructions for deploying the Planetary Agents Backend to production environments.

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Repository Access**: Push access to your Git repository
- [ ] **Environment Variables**: All required environment variables documented
- [ ] **Testing Complete**: All functionality tested locally
- [ ] **Frontend Ready**: Frontend configured to use backend URL
- [ ] **Domain Setup**: Domain/subdomain ready for backend service

## 🎯 Render Deployment (Recommended)

Render provides the easiest deployment path with automatic builds and managed infrastructure.

### Step 1: Prepare Repository

```bash
# Ensure all files are committed
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### Step 2: Create Render Service

1. **Sign up/Login** to [Render](https://render.com)
2. **Click "New +"** → **"Web Service"**
3. **Connect Repository**:
   - Choose your Git provider (GitHub/GitLab)
   - Select your repository
   - Choose the branch (usually `main`)

### Step 3: Configure Service

**Basic Settings:**

- **Name**: `planetary-agents-backend`
- **Region**: Choose based on your users' location
- **Branch**: `main`
- **Root Directory**: `backend` (if your backend is in a subdirectory)

**Build & Deploy:**

- **Runtime**: `Node`
- **Build Command**: `yarn install && yarn build`
- **Start Command**: `yarn start`

### Step 4: Set Environment Variables

In the Render dashboard, add these environment variables:

**Required:**

```bash
NODE_ENV=production
ENABLE_KINETICS_BACKEND=true
ENABLE_CONSCIOUSNESS_BACKEND=true
ENABLE_PLANETARY_BACKEND=true
ENABLE_TOKEN_BACKEND=true
```

**Important:**

```bash
CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://www.yourdomain.com
MAX_REQUEST_SIZE_MB=2
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

**Optional (for enhanced performance):**

```bash
REDIS_URL=redis://username:password@host:port
LOG_LEVEL=info
ALCHM_BACKEND_URL=https://alchm-backend.onrender.com
```

### Step 5: Deploy

1. **Click "Create Web Service"**
2. **Monitor Build Logs**: Watch the deployment process
3. **Wait for "Live"**: Service shows as "Live" when ready

### Step 6: Verify Deployment

```bash
# Replace YOUR_SERVICE_URL with your actual Render URL
export BACKEND_URL="https://your-service-name.onrender.com"

# Test health endpoint
curl $BACKEND_URL/api/health | jq

# Test core functionality
curl -X POST $BACKEND_URL/api/planetary/current-hour \
  -H "Content-Type: application/json" \
  -d '{"location":{"lat":37.7749,"lon":-122.4194}}' | jq
```

### Step 7: Optional - Add Redis

For production workloads, add Redis for better caching:

1. **Go to Dashboard** → **Add Redis**
2. **Choose Plan**: Start with "Starter" ($7/month)
3. **Redis URL**: Automatically added to your web service environment variables

## 🐳 Docker Deployment

For self-hosted or cloud container deployments:

### Build Production Image

```bash
# In the backend directory
docker build -f Dockerfile.production -t planetary-agents-backend:latest .
```

### Run Container Locally (Testing)

```bash
docker run -p 8000:8000 -p 8001:8001 \
  -e NODE_ENV=production \
  -e ENABLE_KINETICS_BACKEND=true \
  -e ENABLE_CONSCIOUSNESS_BACKEND=true \
  -e ENABLE_PLANETARY_BACKEND=true \
  -e ENABLE_TOKEN_BACKEND=true \
  planetary-agents-backend:latest
```

### Deploy to Cloud Providers

**AWS ECS:**

```bash
# Push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-west-2.amazonaws.com
docker tag planetary-agents-backend:latest your-account.dkr.ecr.us-west-2.amazonaws.com/planetary-agents-backend:latest
docker push your-account.dkr.ecr.us-west-2.amazonaws.com/planetary-agents-backend:latest
```

**Google Cloud Run:**

```bash
# Push to GCR
docker tag planetary-agents-backend:latest gcr.io/your-project/planetary-agents-backend:latest
docker push gcr.io/your-project/planetary-agents-backend:latest

# Deploy
gcloud run deploy planetary-agents-backend \
  --image gcr.io/your-project/planetary-agents-backend:latest \
  --port 8000 \
  --allow-unauthenticated
```

## 🖥️ VPS Deployment

For traditional VPS deployment (DigitalOcean, Linode, etc.):

### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
npm install -g yarn

# Install PM2 for process management
npm install -g pm2

# Optional: Install Redis
sudo apt update
sudo apt install redis-server
```

### Deploy Application

```bash
# Clone repository
git clone https://github.com/your-username/planetary-agents.git
cd planetary-agents/backend

# Install dependencies
yarn install --production

# Build application
yarn build

# Set up environment
cp .env.example .env
nano .env  # Configure your environment variables

# Start with PM2
pm2 start dist/index.js --name "planetary-backend"

# Make PM2 start on system boot
pm2 startup
pm2 save
```

### Configure Nginx (Optional)

```nginx
# /etc/nginx/sites-available/planetary-backend
server {
    listen 80;
    server_name backend.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 🔍 Post-Deployment Verification

### Health Check

```bash
# Basic health check
curl https://your-backend-url.com/api/health

# Expected response
{
  "status": "healthy" | "degraded",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 25,
  "services": {
    "cache": {
      "type": "redis" | "memory",
      "connected": true
    }
  }
}
```

### API Functionality Tests

```bash
# Test planetary calculations
curl -X POST https://your-backend-url.com/api/planetary/current-hour \
  -H "Content-Type: application/json" \
  -d '{"location":{"lat":40.7128,"lon":-74.0060}}'

# Test token calculations
curl -X POST https://your-backend-url.com/api/tokens/calculate \
  -H "Content-Type: application/json" \
  -d '{"tokens":{"Spirit":1,"Essence":0.8,"Matter":0.6,"Substance":0.4},"location":{"lat":40.7128,"lon":-74.0060}}'

# Test kinetics (if enabled)
curl -X POST https://your-backend-url.com/api/kinetics/enhanced \
  -H "Content-Type: application/json" \
  -d '{"location":{"lat":40.7128,"lon":-74.0060},"options":{}}'
```

### Performance Tests

```bash
# Response time test
time curl https://your-backend-url.com/api/health

# Load test (using ab)
ab -n 100 -c 10 https://your-backend-url.com/api/health
```

## 🔧 Frontend Integration

After backend deployment, update your frontend environment variables:

```bash
# In your frontend .env.local or .env.production
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-backend-url.com
```

For Vercel frontend deployment:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/update `NEXT_PUBLIC_BACKEND_URL`
5. Redeploy your frontend

## 🚨 Troubleshooting

### Common Issues

**1. 503 Service Unavailable**

```bash
# Check if feature flags are enabled
curl https://your-backend-url.com/api/health | jq '.featureFlags'

# Should show: { "kineticsBackend": true, ... }
```

**2. CORS Errors**

```bash
# Verify CORS_ORIGINS includes your frontend domain
# Add to environment variables:
CORS_ORIGINS=https://your-frontend.vercel.app,https://www.yourdomain.com
```

**3. Memory Issues**

```bash
# Check memory usage in logs
# Add Redis to reduce memory usage:
REDIS_URL=redis://your-redis-instance
```

**4. Slow Response Times**

```bash
# Enable caching
REDIS_URL=redis://your-redis-instance

# Adjust cache TTL
PLANETARY_CACHE_TTL=120
CONSCIOUSNESS_CACHE_TTL=300
```

### Log Analysis

**Render Logs:**

- Go to Render dashboard → Your service → Logs tab
- Look for error patterns and performance metrics

**Docker Logs:**

```bash
docker logs container-name
```

**PM2 Logs:**

```bash
pm2 logs planetary-backend
```

### Health Monitoring

Set up monitoring alerts for:

- Health endpoint returning non-200 status
- Response times > 1000ms
- Error rate > 5%
- Memory usage > 80%

**Example monitoring command:**

```bash
# Run every 5 minutes via cron
*/5 * * * * curl -f https://your-backend-url.com/api/health || echo "Backend health check failed" | mail -s "Alert" admin@yourdomain.com
```

## 📈 Scaling Considerations

**For High Traffic:**

1. **Enable Redis**: For shared caching across instances
2. **Horizontal Scaling**: Multiple instances behind load balancer
3. **Rate Limiting**: Adjust based on traffic patterns
4. **CDN**: For static assets and caching
5. **Database**: Consider PostgreSQL for persistent data

**Performance Optimization:**

```bash
# Environment variables for scaling
RATE_LIMIT_REQUESTS_PER_MINUTE=500
MAX_REQUEST_SIZE_MB=5
PLANETARY_CACHE_TTL=300
REDIS_URL=redis://your-production-redis
```

## 🔒 Security Checklist

- [ ] **HTTPS Only**: Ensure SSL/TLS termination
- [ ] **Environment Variables**: No secrets in code
- [ ] **CORS**: Properly configured origins
- [ ] **Rate Limiting**: Enabled and tuned
- [ ] **Security Headers**: Helmet.js active
- [ ] **Input Validation**: All endpoints protected
- [ ] **Error Handling**: No sensitive data in error responses

## 🎉 Deployment Complete!

Your Planetary Agents Backend is now live!

**Next Steps:**

1. Update frontend to use new backend URL
2. Test full user flows end-to-end
3. Set up monitoring and alerting
4. Create backup and disaster recovery plan
5. Document your deployment for team reference

**Support:**

- Check the main README.md for API documentation
- Use `/api/health` endpoint for system status
- Monitor logs for any issues
- Consider setting up automated deployments for future updates
