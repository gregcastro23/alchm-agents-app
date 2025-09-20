#!/bin/bash

# Planetary Agents Backend - Development Startup Script
# =====================================================

set -e

echo "🚀 Starting Planetary Agents Backend Development Environment"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version check passed: $(node -v)${NC}"

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}Error: Yarn is not installed. Please install yarn first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Yarn is available${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    yarn install
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
    else
        echo -e "${YELLOW}Creating default .env file...${NC}"
        cat > .env << EOF
# Development Configuration
NODE_ENV=development
PORT=8000
HOST=localhost

# External Services
ALCHM_BACKEND_URL=https://alchm-backend.onrender.com
ALCHM_BACKEND_TIMEOUT=30000
ALCHM_BACKEND_MAX_RETRIES=3

# Feature Flags
PLANETARY_HOURS_BACKEND=true
THERMODYNAMICS_BACKEND=true
TOKEN_CALCULATIONS_BACKEND=true
KINETICS_BACKEND=true

# Caching (Redis optional for development)
# REDIS_URL=redis://localhost:6379
CACHE_TTL_PLANETARY_HOURS=3600
CACHE_TTL_THERMODYNAMICS=86400
CACHE_TTL_TOKEN_CALCULATIONS=300
ENABLE_IN_MEMORY_FALLBACK=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=pretty

# WebSocket
ENABLE_WEBSOCKET=true
WEBSOCKET_PORT=8001

# Security
CORS_ORIGIN=http://localhost:3000

# Monitoring
ENABLE_METRICS=true
EOF
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check Redis connection (optional)
if [ -n "$REDIS_URL" ] || command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}Checking Redis connection...${NC}"
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is available${NC}"
    else
        echo -e "${YELLOW}⚠ Redis not available - will use memory cache fallback${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Redis not configured - using memory cache${NC}"
fi

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"

# Run type check
echo -e "${YELLOW}Running type check...${NC}"
if yarn type-check; then
    echo -e "${GREEN}✓ Type check passed${NC}"
else
    echo -e "${RED}✗ Type check failed${NC}"
    echo -e "${YELLOW}Continuing anyway for development...${NC}"
fi

# Run tests (optional)
if [ "$1" = "--with-tests" ]; then
    echo -e "${YELLOW}Running tests...${NC}"
    if yarn test; then
        echo -e "${GREEN}✓ Tests passed${NC}"
    else
        echo -e "${RED}✗ Tests failed${NC}"
        echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

echo ""
echo -e "${BLUE}🎯 Development Environment Ready!${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""
echo -e "📡 API Server will start on: ${GREEN}http://localhost:8000${NC}"
echo -e "🌐 WebSocket Server: ${GREEN}ws://localhost:8001${NC}"
echo -e "📊 Health Check: ${GREEN}http://localhost:8000/api/health${NC}"
echo -e "📚 API Documentation: ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}Available endpoints:${NC}"
echo -e "  • ${BLUE}/api/health${NC} - Health check"
echo -e "  • ${BLUE}/api/planetary/*${NC} - Planetary hour calculations"
echo -e "  • ${BLUE}/api/alchemy/*${NC} - Alchemical calculations"
echo -e "  • ${BLUE}/api/tokens/*${NC} - Token rate calculations"
echo -e "  • ${BLUE}/api/kinetics/*${NC} - Kinetics processing"
echo ""
echo -e "${YELLOW}Feature flags enabled:${NC}"
echo -e "  • Planetary Hours Backend: ${GREEN}✓${NC}"
echo -e "  • Thermodynamics Backend: ${GREEN}✓${NC}"
echo -e "  • Token Calculations Backend: ${GREEN}✓${NC}"
echo -e "  • Kinetics Backend: ${GREEN}✓${NC}"
echo ""
echo -e "${YELLOW}Starting development server...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop${NC}"
echo ""

# Start the development server
exec yarn dev
