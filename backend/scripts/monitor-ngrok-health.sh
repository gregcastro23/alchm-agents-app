#!/bin/bash
# ngrok Tunnel Health Monitor
# Real-time monitoring dashboard for ngrok tunnel and backend health

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
BACKEND_PORT=8000
NGROK_API="http://127.0.0.1:4040/api"
REFRESH_INTERVAL=5

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# Function to get tunnel info
get_tunnel_info() {
    curl -s "${NGROK_API}/tunnels" 2>/dev/null || echo "{}"
}

# Function to get tunnel status
get_tunnel_status() {
    local data=$(get_tunnel_info)
    local url=$(echo "$data" | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

    if [ -z "$url" ]; then
        echo "DISCONNECTED"
        return 1
    fi

    # Test health endpoint
    if curl -s -f "${url}/api/health" -o /dev/null -m 5 2>/dev/null; then
        echo "HEALTHY|$url"
        return 0
    else
        echo "UNHEALTHY|$url"
        return 1
    fi
}

# Function to get backend status
get_backend_status() {
    if lsof -i:${BACKEND_PORT} -t > /dev/null 2>&1; then
        if curl -s -f "http://localhost:${BACKEND_PORT}/api/health" -o /dev/null -m 5 2>/dev/null; then
            echo "HEALTHY"
            return 0
        else
            echo "UNHEALTHY"
            return 1
        fi
    else
        echo "OFFLINE"
        return 1
    fi
}

# Function to get connection metrics
get_connection_metrics() {
    local data=$(get_tunnel_info)
    local conns=$(echo "$data" | grep -o '"conns":{[^}]*}' | grep -o '"count":[0-9]*' | cut -d':' -f2 | head -1)
    local http_count=$(echo "$data" | grep -o '"http":{[^}]*}' | grep -o '"count":[0-9]*' | cut -d':' -f2 | head -1)

    echo "${conns:-0}|${http_count:-0}"
}

# Function to get backend health details
get_backend_health() {
    local health=$(curl -s "http://localhost:${BACKEND_PORT}/api/health" 2>/dev/null || echo "{}")
    local status=$(echo "$health" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    local uptime=$(echo "$health" | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
    local response_time=$(echo "$health" | grep -o '"responseTime":[0-9.]*' | cut -d':' -f2)

    echo "${status:-unknown}|${uptime:-0}|${response_time:-0}"
}

# Function to display dashboard
display_dashboard() {
    clear

    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║     Planetary Agents - ngrok Health Monitoring Dashboard      ║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Backend Status
    echo -e "${BOLD}${CYAN}🖥️  Backend Service${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local backend_status=$(get_backend_status)
    case $backend_status in
        "HEALTHY")
            echo -e "   Status: ${GREEN}●${NC} ${BOLD}HEALTHY${NC}"
            ;;
        "UNHEALTHY")
            echo -e "   Status: ${YELLOW}●${NC} ${BOLD}UNHEALTHY${NC}"
            ;;
        "OFFLINE")
            echo -e "   Status: ${RED}●${NC} ${BOLD}OFFLINE${NC}"
            ;;
    esac

    echo -e "   Port: ${BACKEND_PORT}"

    # Get health details if backend is running
    if [ "$backend_status" != "OFFLINE" ]; then
        local health_info=$(get_backend_health)
        IFS='|' read -r status uptime response_time <<< "$health_info"

        echo -e "   Health Status: ${status}"
        if [ "$uptime" != "0" ]; then
            local uptime_hours=$(echo "scale=2; $uptime / 3600" | bc)
            echo -e "   Uptime: ${uptime_hours}h (${uptime}s)"
        fi
        if [ "$response_time" != "0" ]; then
            echo -e "   Response Time: ${response_time}ms"
        fi
    fi

    echo ""

    # ngrok Tunnel Status
    echo -e "${BOLD}${MAGENTA}🌐 ngrok Tunnel${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local tunnel_status=$(get_tunnel_status)
    IFS='|' read -r status url <<< "$tunnel_status"

    case $status in
        "HEALTHY")
            echo -e "   Status: ${GREEN}●${NC} ${BOLD}HEALTHY${NC}"
            echo -e "   URL: ${GREEN}${url}${NC}"
            ;;
        "UNHEALTHY")
            echo -e "   Status: ${YELLOW}●${NC} ${BOLD}UNHEALTHY${NC}"
            echo -e "   URL: ${YELLOW}${url}${NC}"
            ;;
        "DISCONNECTED")
            echo -e "   Status: ${RED}●${NC} ${BOLD}DISCONNECTED${NC}"
            echo -e "   URL: ${RED}N/A${NC}"
            ;;
    esac

    # Connection Metrics
    if [ "$status" != "DISCONNECTED" ]; then
        local metrics=$(get_connection_metrics)
        IFS='|' read -r conns http_count <<< "$metrics"

        echo -e "   Total Connections: ${conns}"
        echo -e "   HTTP Requests: ${http_count}"
    fi

    echo ""

    # API Endpoints
    if [ "$status" == "HEALTHY" ]; then
        echo -e "${BOLD}${GREEN}✅ Available Endpoints${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "   ${url}/api/health"
        echo -e "   ${url}/api/planetary/current-hour"
        echo -e "   ${url}/api/alchemy/thermodynamics"
        echo -e "   ${url}/api/tokens/calculate"
        echo ""
    fi

    # Vercel Integration Status
    echo -e "${BOLD}${BLUE}📦 Vercel Integration${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ "$status" == "HEALTHY" ]; then
        # Check if Vercel env var matches current URL
        local current_vercel_url=$(vercel env ls 2>/dev/null | grep "NEXT_PUBLIC_BACKEND_URL" | head -1 | awk '{print $2}' || echo "")

        if [ "$current_vercel_url" == "$url" ]; then
            echo -e "   Status: ${GREEN}●${NC} ${BOLD}SYNCHRONIZED${NC}"
            echo -e "   Environment Variable: ${GREEN}${current_vercel_url}${NC}"
        else
            echo -e "   Status: ${YELLOW}●${NC} ${BOLD}OUT OF SYNC${NC}"
            echo -e "   Current: ${RED}${current_vercel_url}${NC}"
            echo -e "   Expected: ${GREEN}${url}${NC}"
            echo -e "   ${YELLOW}⚠️  Run: echo \"${url}\" | vercel env add NEXT_PUBLIC_BACKEND_URL production${NC}"
        fi
    else
        echo -e "   Status: ${RED}●${NC} ${BOLD}UNAVAILABLE${NC}"
        echo -e "   Waiting for healthy tunnel..."
    fi

    echo ""

    # Footer
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "   Last Update: $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "   Refresh Interval: ${REFRESH_INTERVAL}s"
    echo -e "   ${YELLOW}Press Ctrl+C to exit${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Main monitoring loop
main() {
    echo -e "${BLUE}🚀 Starting ngrok Health Monitor...${NC}"
    echo -e "${YELLOW}Loading...${NC}"
    sleep 2

    while true; do
        display_dashboard
        sleep $REFRESH_INTERVAL
    done
}

# Trap for clean exit
trap 'echo -e "\n${BLUE}👋 Monitoring stopped${NC}"; exit 0' INT TERM

# Run monitor
main
