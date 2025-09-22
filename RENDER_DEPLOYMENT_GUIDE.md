# 🚀 RENDER DEPLOYMENT GUIDE - PLANETARY AGENTS BACKEND

## 📋 **PRE-DEPLOYMENT CHECKLIST**

✅ **Code Status:**
- Backend server tested and running locally on port 8000
- All random values replaced with deterministic calculations
- Database operations verified (user registration, evolution tracking)
- API endpoints tested and responding correctly
- Git repository updated with latest changes

✅ **Files Ready:**
- `render-backend.env` - Environment variables for Render
- `backend/package.json` - Dependencies and scripts configured
- `DEPLOYMENT_READY.md` - Complete deployment documentation

## 🔧 **RENDER DEPLOYMENT STEPS**

### **Step 1: Create Render Account & Service (5 minutes)**

1. **Visit Render Dashboard**: https://render.com/
2. **Sign up/Login** with GitHub (recommended for easier repo connection)
3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository: `planetary-agents`
   - Choose branch: `My_alchm`

### **Step 2: Configure Service Settings (10 minutes)**

#### **Basic Settings:**
```
Service Name: planetary-agents-backend
Environment: Node
Region: Oregon (US West) or closest to your users
Branch: My_alchm
Root Directory: backend
```

#### **Build & Deploy Commands:**
```bash
Build Command: yarn install && yarn build
Start Command: yarn start
```

#### **Advanced Settings:**
```
Node Version: 18 (or latest LTS)
Auto-Deploy: Yes (deploys on git push)
```

### **Step 3: Environment Variables (15 minutes)**

**Copy these from `render-backend.env`:**

#### **Core Configuration:**
```
NODE_ENV=production
HOST=0.0.0.0
```

#### **Feature Flags:**
```
PLANETARY_HOURS_BACKEND=true
THERMODYNAMICS_BACKEND=true
TOKEN_CALCULATIONS_BACKEND=true
KINETICS_BACKEND=true
ENABLE_WEBSOCKET=true
```

#### **API Keys (from render-backend.env):**
```
ANTHROPIC_API_KEY=sk-ant-api03-ZXNzb2xhdG8zMDIzLWEyMDIzLTA5LTE4VDA2OjQ5OjEuOTA3WjpjbGF1ZGUtY29kZS1hcGktYWNjZXNz
OPENAI_API_KEY=sk-uK4InAHNJcUjL3pgiKtrIQsMeLUyroFs1K9lezjkk4T3BlbkFJob35hofh3OUmSXK6-K7TOP3aQcgun80De-aabI-ZgA
```

#### **External Services:**
```
ALCHM_BACKEND_URL=https://alchm-backend.onrender.com
```

#### **Performance & Security:**
```
RATE_LIMIT_REQUESTS_PER_MINUTE=100
MAX_REQUEST_SIZE_MB=10
LOG_LEVEL=info
LOG_FORMAT=json
```

#### **Database (PostgreSQL):**
```
DATABASE_URL=postgresql://username:password@hostname:port/database
```
*Note: You'll need to create a PostgreSQL database first (see Step 4)*

### **Step 4: Database Setup (10 minutes)**

#### **Option A: Render PostgreSQL (Recommended)**
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Database Name: `planetary-agents-db`
3. Copy the **External Database URL** from the database info
4. Add it as `DATABASE_URL` environment variable in your web service

#### **Option B: External Database (Supabase/PlanetScale)**
1. Create account on Supabase.com or PlanetScale.com
2. Create new database: `planetary_agents`
3. Copy connection string
4. Add as `DATABASE_URL` environment variable

### **Step 5: Deploy & Verify (10 minutes)**

1. **Deploy Service**:
   - Click "Create Web Service"
   - Render will automatically start building and deploying
   - Watch the build logs for any errors

2. **Monitor Deployment**:
   - Build should complete in 2-5 minutes
   - Service will be available at: `https://your-service-name.onrender.com`

3. **Test Endpoints**:
   ```bash
   # Health Check
   curl https://your-service-name.onrender.com/api/health

   # Should return:
   {
     "status": "operational" or "degraded",
     "timestamp": "...",
     "services": {...}
   }
   ```

4. **Database Migration**:
   ```bash
   # If using remote database, run migration
   # This can be done from your local machine or Render shell
   DATABASE_URL="your_production_url" npx prisma db push
   ```

### **Step 6: Update Frontend Configuration (5 minutes)**

1. **Note your Render backend URL**: `https://your-service-name.onrender.com`
2. **Update frontend environment** (for Vercel deployment):
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-service-name.onrender.com
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-service-name.onrender.com
   ```

## 🔍 **VERIFICATION CHECKLIST**

### **Backend Health:**
- [ ] Service shows "Live" status in Render dashboard
- [ ] Health endpoint responds: `GET /api/health`
- [ ] No critical errors in Render logs
- [ ] Build completed without errors

### **API Endpoints:**
- [ ] `GET /api/health` - Service status
- [ ] `POST /api/kinetics/enhanced` - Kinetics calculations
- [ ] `POST /api/kinetics/group` - Group dynamics
- [ ] `GET /api/planetary/current-hour` - Planetary hours
- [ ] `POST /api/tokens/calculate` - Token calculations

### **Database Connectivity:**
- [ ] Database connection established (check logs)
- [ ] No database connection errors
- [ ] Prisma schema applied correctly

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

#### **Build Fails:**
```bash
# Check package.json in backend directory
# Ensure all dependencies are listed
# Verify Node.js version compatibility
```

#### **Database Connection Errors:**
```bash
# Verify DATABASE_URL format
# Check database server is running
# Confirm firewall/security group settings
```

#### **API Endpoints Return 500:**
```bash
# Check Render logs for detailed error messages
# Verify all environment variables are set
# Check external service connectivity (alchm-backend)
```

#### **Performance Issues:**
```bash
# Monitor memory usage in Render dashboard
# Check for memory leaks in logs
# Consider upgrading Render plan if needed
```

## 📊 **EXPECTED PERFORMANCE**

### **Response Times (Production):**
- Health Check: 20-100ms
- Kinetics Calculations: 100-500ms
- Database Operations: 50-200ms
- Agent Evolution: 100-300ms

### **Resource Usage:**
- Memory: ~128-256MB
- CPU: Low (Node.js is efficient)
- Bandwidth: Minimal (API responses)

## 🎯 **POST-DEPLOYMENT TASKS**

1. **Monitor for 24 hours**:
   - Check Render logs for errors
   - Monitor response times
   - Verify all features working

2. **Update CORS settings**:
   - Add your frontend domain to CORS_ORIGINS
   - Test cross-origin requests

3. **Set up monitoring** (optional):
   - Configure alerts for downtime
   - Set up log aggregation
   - Monitor database performance

4. **Performance optimization**:
   - Enable Redis if traffic increases
   - Consider CDN for static assets
   - Monitor and optimize database queries

## ✅ **DEPLOYMENT SUCCESS CONFIRMATION**

Your backend is successfully deployed when:
- ✅ Render service shows "Live" status
- ✅ Health endpoint returns successful response
- ✅ All API endpoints respond correctly
- ✅ Database operations work (check with frontend)
- ✅ No critical errors in logs
- ✅ Frontend can connect and display data

**Your Planetary Agents backend is now live and serving consciousness evolution! 🎉**

---

**Need Help?**
- Check Render logs for detailed error messages
- Review `DEPLOYMENT_READY.md` for complete documentation
- Ensure all environment variables from `render-backend.env` are set correctly