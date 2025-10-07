#!/bin/bash
# Master Production Startup Script
# Starts backend, ngrok tunnel, and monitoring dashboard

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
echo -e "${BOLD}${BLUE}║   Planetary Agents - Production Backend Startup Script    ║${NC}"
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

# Check if ngrok is already running
if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
    EXISTING_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

    if [ ! -z "$EXISTING_URL" ]; then
        echo -e "${YELLOW}⚠️  ngrok tunnel is already running${NC}"
        echo -e "${CYAN}URL: ${EXISTING_URL}${NC}"
        read -p "Restart tunnel? (y/N): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Stopping existing ngrok...${NC}"
            pkill ngrok || true
            sleep 2
        else
            echo -e "${GREEN}Using existing tunnel${NC}"
            NGROK_URL="$EXISTING_URL"
        fi
    fi
fi

# Start ngrok if not running
if [ -z "$NGROK_URL" ]; then
    echo -e "${BLUE}🌐 Starting ngrok tunnel...${NC}"

    nohup ngrok http 8000 --log=stdout > logs/ngrok.log 2>&1 &
    NGROK_PID=$!
    echo $NGROK_PID > logs/ngrok.pid

    echo -e "${GREEN}✅ ngrok starting (PID: $NGROK_PID)${NC}"
    echo -e "${BLUE}⏳ Waiting for tunnel to establish...${NC}"

    # Wait for tunnel
    for i in {1..15}; do
        NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

        if [ ! -z "$NGROK_URL" ]; then
            echo -e "${GREEN}✅ Tunnel established!${NC}"
            break
        fi

        if [ $i -eq 15 ]; then
            echo -e "${RED}❌ Failed to establish tunnel${NC}"
            exit 1
        fi

        sleep 1
    done
fi

echo ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║              🎉 Production Backend Ready!                ║${NC}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Backend URL:${NC}    http://localhost:8000"
echo -e "${CYAN}ngrok URL:${NC}      ${GREEN}${NGROK_URL}${NC}"
echo -e "${CYAN}Health Check:${NC}   ${NGROK_URL}/api/health"
echo -e "${CYAN}Vercel Site:${NC}    https://v0-planetary-agents1.vercel.app"
echo ""

# Check if Vercel env var matches
echo -e "${BLUE}Checking Vercel integration...${NC}"
VERCEL_URL=$(vercel env ls 2>/dev/null | grep "NEXT_PUBLIC_BACKEND_URL" | awk '{print $2}' | head -1 || echo "")

if [ "$VERCEL_URL" == "$NGROK_URL" ]; then
    echo -e "${GREEN}✅ Vercel environment variable is synchronized${NC}"
elif [ "$VERCEL_URL" == "Encrypted" ]; then
    echo -e "${YELLOW}ℹ️  Vercel environment variable is encrypted (cannot verify)${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel environment variable may be out of sync${NC}"
    echo -e "${CYAN}Update with:${NC}"
    echo -e "  ${DIM}echo \"${NGROK_URL}\" | vercel env add NEXT_PUBLIC_BACKEND_URL production${NC}"
    echo -e "  ${DIM}vercel --prod${NC}"
fi

echo ""
echo -e "${BOLD}${CYAN}Available Commands:${NC}"
echo -e "  ${DIM}# View monitoring dashboard${NC}"
echo -e "  ${BLUE}./backend/scripts/monitoring-dashboard.sh${NC}"
echo ""
echo -e "  ${DIM}# Test all API endpoints${NC}"
echo -e "  ${BLUE}./backend/scripts/test-endpoints.sh${NC}"
echo ""
echo -e "  ${DIM}# Start persistent ngrok (auto-restart)${NC}"
echo -e "  ${BLUE}./backend/scripts/start-ngrok-persistent.sh${NC}"
echo ""
echo -e "  ${DIM}# View backend logs${NC}"
echo -e "  ${BLUE}tail -f backend/logs/backend.log${NC}"
echo ""
echo -e "${BOLD}${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"

    # Stop backend
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID 2>/dev/null || true
            echo -e "${GREEN}✅ Backend stopped${NC}"
        fi
        rm -f logs/backend.pid
    fi

    # Stop ngrok
    if [ -f "logs/ngrok.pid" ]; then
        NGROK_PID=$(cat logs/ngrok.pid)
        if kill -0 $NGROK_PID 2>/dev/null; then
            kill $NGROK_PID 2>/dev/null || true
            echo -e "${GREEN}✅ ngrok stopped${NC}"
        fi
        rm -f logs/ngrok.pid
    fi

    echo -e "${BLUE}👋 Goodbye!${NC}"
}

trap cleanup EXIT INT TERM

# Keep script running to maintain services
echo -e "${DIM}Services running. Press Ctrl+C to stop all services.${NC}"
echo ""

# Monitor services
while true; do
    # Check backend
    if ! lsof -i:8000 -t > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend died! Restarting...${NC}"
        cd "$BACKEND_DIR"
        nohup yarn dev > logs/backend.log 2>&1 &
        echo $! > logs/backend.pid
    fi

    # Check ngrok
    if ! curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
        echo -e "${RED}❌ ngrok died! Restarting...${NC}"
        nohup ngrok http 8000 --log=stdout > logs/ngrok.log 2>&1 &
        echo $! > logs/ngrok.pid
    fi

    sleep 30
done
