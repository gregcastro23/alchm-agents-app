#!/bin/bash
# Persistent ngrok Tunnel Launcher with Auto-Restart
# Ensures tunnel stays alive and automatically restarts on failure

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$BACKEND_DIR")"

# Configuration
BACKEND_PORT=8000
NGROK_LOG_FILE="${BACKEND_DIR}/logs/ngrok.log"
NGROK_PID_FILE="${BACKEND_DIR}/logs/ngrok.pid"
TUNNEL_URL_FILE="${BACKEND_DIR}/logs/tunnel-url.txt"
MAX_RESTART_ATTEMPTS=10
RESTART_DELAY=5
HEALTH_CHECK_INTERVAL=30

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p "${BACKEND_DIR}/logs"

echo -e "${BLUE}🚀 Planetary Agents - Persistent ngrok Tunnel${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if backend is running
if ! lsof -i:${BACKEND_PORT} -t > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on port ${BACKEND_PORT}${NC}"
    echo -e "${YELLOW}Start the backend first with: cd backend && yarn dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend detected on port ${BACKEND_PORT}${NC}"

# Function to get tunnel URL from ngrok API
get_tunnel_url() {
    local max_attempts=10
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local url=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

        if [ ! -z "$url" ]; then
            echo "$url"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 1
    done

    return 1
}

# Function to save tunnel URL to file and update Vercel
save_tunnel_url() {
    local url=$1
    echo "$url" > "$TUNNEL_URL_FILE"
    echo -e "${GREEN}📝 Tunnel URL saved to: ${TUNNEL_URL_FILE}${NC}"
    echo -e "${BLUE}🌐 Public URL: ${url}${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Update Vercel environment variables:${NC}"
    echo -e "${YELLOW}   NEXT_PUBLIC_BACKEND_URL=${url}${NC}"
    echo -e "${YELLOW}   Run: echo \"${url}\" | vercel env add NEXT_PUBLIC_BACKEND_URL production${NC}"
    echo ""
}

# Function to check if ngrok is healthy
check_ngrok_health() {
    local url=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

    if [ -z "$url" ]; then
        return 1
    fi

    # Try to hit the health endpoint through ngrok
    if curl -s -f "${url}/api/health" -o /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to start ngrok
start_ngrok() {
    echo -e "${BLUE}🔌 Starting ngrok tunnel...${NC}"

    # Kill existing ngrok processes
    if [ -f "$NGROK_PID_FILE" ]; then
        local old_pid=$(cat "$NGROK_PID_FILE")
        if kill -0 $old_pid 2>/dev/null; then
            echo -e "${YELLOW}Stopping existing ngrok process (PID: $old_pid)${NC}"
            kill $old_pid 2>/dev/null || true
            sleep 2
        fi
    fi

    # Start ngrok in background
    nohup ngrok http ${BACKEND_PORT} --log=stdout > "$NGROK_LOG_FILE" 2>&1 &
    local ngrok_pid=$!
    echo $ngrok_pid > "$NGROK_PID_FILE"

    echo -e "${GREEN}✅ ngrok started (PID: $ngrok_pid)${NC}"

    # Wait for tunnel to be ready
    echo -e "${BLUE}⏳ Waiting for tunnel to establish...${NC}"
    sleep 3

    # Get and save tunnel URL
    local tunnel_url=$(get_tunnel_url)
    if [ -z "$tunnel_url" ]; then
        echo -e "${RED}❌ Failed to get tunnel URL${NC}"
        return 1
    fi

    save_tunnel_url "$tunnel_url"
    return 0
}

# Function to monitor and restart ngrok
monitor_ngrok() {
    local restart_count=0

    echo -e "${GREEN}👁️  Monitoring ngrok tunnel health...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""

    while true; do
        if check_ngrok_health; then
            echo -e "${GREEN}✅ $(date '+%Y-%m-%d %H:%M:%S') - Tunnel healthy${NC}"
            restart_count=0
        else
            echo -e "${RED}❌ $(date '+%Y-%m-%d %H:%M:%S') - Tunnel unhealthy or disconnected${NC}"

            if [ $restart_count -ge $MAX_RESTART_ATTEMPTS ]; then
                echo -e "${RED}💥 Maximum restart attempts ($MAX_RESTART_ATTEMPTS) reached${NC}"
                echo -e "${RED}Please check backend and ngrok logs${NC}"
                exit 1
            fi

            restart_count=$((restart_count + 1))
            echo -e "${YELLOW}🔄 Restarting ngrok (attempt $restart_count/$MAX_RESTART_ATTEMPTS)${NC}"

            if start_ngrok; then
                echo -e "${GREEN}✅ ngrok restarted successfully${NC}"
            else
                echo -e "${RED}❌ Failed to restart ngrok${NC}"
                echo -e "${YELLOW}Waiting ${RESTART_DELAY} seconds before retry...${NC}"
                sleep $RESTART_DELAY
            fi
        fi

        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping ngrok tunnel...${NC}"

    if [ -f "$NGROK_PID_FILE" ]; then
        local ngrok_pid=$(cat "$NGROK_PID_FILE")
        if kill -0 $ngrok_pid 2>/dev/null; then
            kill $ngrok_pid 2>/dev/null || true
            echo -e "${GREEN}✅ ngrok stopped${NC}"
        fi
        rm -f "$NGROK_PID_FILE"
    fi

    echo -e "${BLUE}👋 Goodbye!${NC}"
}

# Trap signals for cleanup
trap cleanup EXIT INT TERM

# Start ngrok
if ! start_ngrok; then
    echo -e "${RED}❌ Failed to start ngrok${NC}"
    exit 1
fi

# Start monitoring
monitor_ngrok
