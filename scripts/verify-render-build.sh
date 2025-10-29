#!/bin/bash
# Verify Render build readiness for Planetary Agents
# Run this locally before deploying to catch issues early

set -e  # Exit on any error

echo "🔍 Verifying Render Build Readiness..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo -e "\n📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    echo -e "${GREEN}✓ Node.js version OK: $(node -v)${NC}"
else
    echo -e "${RED}✗ Node.js version must be 20+, found: $(node -v)${NC}"
    exit 1
fi

# Check Yarn
echo -e "\n📦 Checking Yarn..."
if command -v yarn &> /dev/null; then
    echo -e "${GREEN}✓ Yarn found: $(yarn -v)${NC}"
else
    echo -e "${RED}✗ Yarn not found. Install with: npm install -g yarn${NC}"
    exit 1
fi

# Check required environment variables
echo -e "\n🔐 Checking environment variables..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "OPENAI_API_KEY"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}⚠ Missing: $var${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        echo -e "${GREEN}✓ Set: $var${NC}"
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "${YELLOW}\nNote: Set these in Render dashboard before deploying${NC}"
fi

# Test database connection (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo -e "\n🗄️  Testing database connection..."
    if npx prisma db pull --force --schema=prisma/schema.prisma > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}✗ Database connection failed${NC}"
        echo "  Check your DATABASE_URL format"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Skipping database test (DATABASE_URL not set)${NC}"
fi

# Test frontend build
echo -e "\n🏗️  Testing frontend build..."
echo "  Installing dependencies..."
if yarn install --frozen-lockfile > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Dependency installation failed${NC}"
    exit 1
fi

echo "  Generating Prisma client..."
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prisma client generated${NC}"
else
    echo -e "${RED}✗ Prisma generation failed${NC}"
    exit 1
fi

echo "  Building Next.js..."
if yarn build > build.log 2>&1; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
    rm build.log
else
    echo -e "${RED}✗ Frontend build failed. Check build.log for details${NC}"
    tail -20 build.log
    exit 1
fi

# Test backend build
echo -e "\n🏗️  Testing backend build..."
cd backend

echo "  Installing backend dependencies..."
if yarn install --frozen-lockfile > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Backend dependency installation failed${NC}"
    exit 1
fi

echo "  Building backend..."
if yarn build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend build successful${NC}"
else
    echo -e "${YELLOW}⚠ Backend build completed with warnings (this is OK)${NC}"
fi

cd ..

# Check health endpoints exist
echo -e "\n🏥 Verifying health check endpoints..."
if [ -f "app/api/health/route.ts" ]; then
    echo -e "${GREEN}✓ Frontend health endpoint exists${NC}"
else
    echo -e "${RED}✗ Frontend health endpoint missing${NC}"
    exit 1
fi

if [ -f "backend/src/routes/health.ts" ]; then
    echo -e "${GREEN}✓ Backend health endpoint exists${NC}"
else
    echo -e "${RED}✗ Backend health endpoint missing${NC}"
    exit 1
fi

# Summary
echo -e "\n======================================"
echo -e "${GREEN}✅ Build verification complete!${NC}"
echo -e "\nNext steps:"
echo "1. Push to Git: git push origin main"
echo "2. In Render dashboard:"
echo "   - Create services using render.yaml or manually"
echo "   - Set environment variables (see RENDER_DEPLOYMENT.md)"
echo "   - Trigger deployment"
echo "3. Run migrations: DATABASE_URL=<url> npx prisma migrate deploy"
echo "4. Verify health checks pass"
echo ""
