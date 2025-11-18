#!/bin/bash
# Master Production Startup Script
# Starts backend server for local development

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}╔═════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║   Planetary Agents - Backend Startup Script                ║${NC}"
echo -e "${BOLD}${BLUE}╚═════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backend is already running
if lsof -i:8000 -t > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend is already running on port 8000${NC}"
    read -p "Stop and restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Stopping existing backend...${NC}"
        lsof -i:8000 -t | xargs kill 2>/dev/null || true
        sleep 2
    else
        echo -e "${GREEN}Using existing backend${NC}"
        exit 0
    fi
fi

# Start backend if not running
if ! lsof -i:8000 -t > /dev/null 2>&1; then
    echo -e "${BLUE}🚀 Starting backend server...${NC}"
    cd "$BACKEND_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        yarn install
    fi

    # Create logs directory
    mkdir -p logs

    # Start backend in background
    nohup yarn dev > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > logs/backend.pid

    echo -e "${GREEN}✅ Backend starting (PID: $BACKEND_PID)${NC}"
    echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"

    # Wait for backend to be ready
    for i in {1..30}; do
        if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            break
        fi

        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Backend failed to start${NC}"
            echo -e "${YELLOW}Check logs: tail -f $BACKEND_DIR/logs/backend.log${NC}"
            exit 1
        fi

        sleep 1
    done
else
    echo -e "${GREEN}✅ Backend is running${NC}"
fi

echo ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║              🎉 Backend Ready!                           ║${NC}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Backend URL:${NC}    http://localhost:8000"
echo -e "${CYAN}Health Check:${NC}   http://localhost:8000/api/health"
echo ""
echo -e "${YELLOW}ℹ️  For production deployment, use Render or Railway${NC}"
echo -e "${YELLOW}   See: BACKEND_DEPLOYMENT_GUIDE.md${NC}"
echo ""

echo -e "${BOLD}${CYAN}Available Commands:${NC}"
echo -e "  ${DIM}# View monitoring dashboard${NC}"
echo -e "  ${BLUE}./backend/scripts/monitoring-dashboard.sh${NC}"
echo ""
echo -e "  ${DIM}# Test all API endpoints${NC}"
echo -e "  ${BLUE}./backend/scripts/test-endpoints.sh${NC}"
echo ""
echo -e "  ${DIM}# View backend logs${NC}"
echo -e "  ${BLUE}tail -f backend/logs/backend.log${NC}"
echo ""
echo -e "${BOLD}${YELLOW}Press Ctrl+C to stop the backend${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping backend...${NC}"

    # Stop backend
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID 2>/dev/null || true
            echo -e "${GREEN}✅ Backend stopped${NC}"
        fi
        rm -f logs/backend.pid
    fi

    echo -e "${BLUE}👋 Goodbye!${NC}"
}

trap cleanup EXIT INT TERM

# Keep script running to maintain backend
echo -e "${DIM}Backend running. Press Ctrl+C to stop.${NC}"
echo ""

# Monitor backend
while true; do
    # Check backend
    if ! lsof -i:8000 -t > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend died! Restarting...${NC}"
        cd "$BACKEND_DIR"
        nohup yarn dev > logs/backend.log 2>&1 &
        echo $! > logs/backend.pid
        echo -e "${GREEN}✅ Backend restarted${NC}"
    fi

    sleep 30
done
