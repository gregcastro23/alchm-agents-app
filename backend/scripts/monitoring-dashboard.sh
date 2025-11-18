#!/bin/bash
# Comprehensive Backend Monitoring Dashboard
# Real-time statistics, performance metrics, and health monitoring

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
BACKEND_PORT=8000
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
REFRESH_INTERVAL=3

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

# Unicode symbols
CHECK="✓"
CROSS="✗"
ARROW="→"
STAR="★"

# Function to get timestamp
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Function to format uptime
format_uptime() {
    local seconds=$1
    local days=$((seconds / 86400))
    local hours=$(((seconds % 86400) / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))

    if [ $days -gt 0 ]; then
        echo "${days}d ${hours}h ${minutes}m"
    elif [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m ${secs}s"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m ${secs}s"
    else
        echo "${secs}s"
    fi
}

# Function to get backend health
get_backend_health() {
    curl -s "${BACKEND_URL}/api/health" 2>/dev/null || echo '{"status":"offline"}'
}

# Function to display header
display_header() {
    echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║      PLANETARY AGENTS - BACKEND MONITORING DASHBOARD v1.0               ║${NC}"
    echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to display backend section
display_backend_section() {
    local health=$(get_backend_health)
    local status=$(echo "$health" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    local uptime=$(echo "$health" | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
    local response_time=$(echo "$health" | grep -o '"responseTime":[0-9.]*' | cut -d':' -f2)
    local version=$(echo "$health" | grep -o '"version":"[^"]*' | cut -d'"' -f4)
    local environment=$(echo "$health" | grep -o '"environment":"[^"]*' | cut -d'"' -f4)

    echo -e "${BOLD}${CYAN}╭─ Backend Service Status${NC}"
    echo -e "${CYAN}│${NC}"

    # Status indicator
    case $status in
        "healthy"|"ok")
            echo -e "${CYAN}│${NC} ${GREEN}${CHECK}${NC} ${BOLD}Status:${NC} ${GREEN}HEALTHY${NC}"
            ;;
        "degraded")
            echo -e "${CYAN}│${NC} ${YELLOW}${STAR}${NC} ${BOLD}Status:${NC} ${YELLOW}DEGRADED${NC}"
            ;;
        "offline")
            echo -e "${CYAN}│${NC} ${RED}${CROSS}${NC} ${BOLD}Status:${NC} ${RED}OFFLINE${NC}"
            echo -e "${CYAN}│${NC}"
            echo -e "${CYAN}│${NC} ${RED}Backend is not responding at ${BACKEND_URL}${NC}"
            echo -e "${CYAN}│${NC} ${DIM}Start with: ./backend/scripts/start-production.sh${NC}"
            echo -e "${CYAN}╰─${NC}"
            return
            ;;
        *)
            echo -e "${CYAN}│${NC} ${RED}${CROSS}${NC} ${BOLD}Status:${NC} ${RED}UNKNOWN${NC}"
            echo -e "${CYAN}╰─${NC}"
            return
            ;;
    esac

    # Basic info
    echo -e "${CYAN}│${NC} ${DIM}URL:${NC} ${BACKEND_URL}"
    echo -e "${CYAN}│${NC} ${DIM}Version:${NC} ${version:-N/A}"
    echo -e "${CYAN}│${NC} ${DIM}Environment:${NC} ${environment:-development}"

    # Performance metrics
    if [ ! -z "$uptime" ] && [ "$uptime" != "0" ]; then
        local formatted_uptime=$(format_uptime ${uptime%.*})
        echo -e "${CYAN}│${NC} ${DIM}Uptime:${NC} ${formatted_uptime}"
    fi

    if [ ! -z "$response_time" ] && [ "$response_time" != "0" ]; then
        if (( $(echo "$response_time < 100" | bc -l 2>/dev/null || echo 0) )); then
            echo -e "${CYAN}│${NC} ${DIM}Response Time:${NC} ${GREEN}${response_time}ms${NC}"
        elif (( $(echo "$response_time < 500" | bc -l 2>/dev/null || echo 0) )); then
            echo -e "${CYAN}│${NC} ${DIM}Response Time:${NC} ${YELLOW}${response_time}ms${NC}"
        else
            echo -e "${CYAN}│${NC} ${DIM}Response Time:${NC} ${RED}${response_time}ms${NC}"
        fi
    fi

    # Service status
    local cache_type=$(echo "$health" | grep -o '"cache":{"type":"[^"]*' | cut -d'"' -f6 || echo "")
    if [ ! -z "$cache_type" ]; then
        echo -e "${CYAN}│${NC} ${DIM}Cache:${NC} ${cache_type}"
    fi

    echo -e "${CYAN}╰─${NC}"
}

# Function to display API endpoints
display_api_endpoints() {
    echo ""
    echo -e "${BOLD}${GREEN}╭─ API Endpoints${NC}"
    echo -e "${GREEN}│${NC}"
    echo -e "${GREEN}│${NC} ${DIM}Health:${NC}         ${BACKEND_URL}/api/health"
    echo -e "${GREEN}│${NC} ${DIM}Planetary:${NC}      ${BACKEND_URL}/api/planetary/current-hour"
    echo -e "${GREEN}│${NC} ${DIM}Thermodynamics:${NC} ${BACKEND_URL}/api/alchemy/thermodynamics"
    echo -e "${GREEN}│${NC} ${DIM}Tokens:${NC}         ${BACKEND_URL}/api/tokens/calculate"
    echo -e "${GREEN}│${NC} ${DIM}Kinetics:${NC}       ${BACKEND_URL}/api/kinetics/evolution"
    echo -e "${GREEN}│${NC} ${DIM}Consciousness:${NC}   ${BACKEND_URL}/api/consciousness/live"
    echo -e "${GREEN}╰─${NC}"
}

# Function to display deployment info
display_deployment_info() {
    echo ""
    echo -e "${BOLD}${BLUE}╭─ Deployment Information${NC}"
    echo -e "${BLUE}│${NC}"
    
    if [[ "$BACKEND_URL" == *"localhost"* ]] || [[ "$BACKEND_URL" == *"127.0.0.1"* ]]; then
        echo -e "${BLUE}│${NC} ${YELLOW}${STAR}${NC} ${BOLD}Mode:${NC} ${YELLOW}LOCAL DEVELOPMENT${NC}"
        echo -e "${BLUE}│${NC} ${DIM}For production, deploy to Render/Railway${NC}"
        echo -e "${BLUE}│${NC} ${DIM}See: BACKEND_DEPLOYMENT_GUIDE.md${NC}"
    else
        echo -e "${BLUE}│${NC} ${GREEN}${CHECK}${NC} ${BOLD}Mode:${NC} ${GREEN}PRODUCTION${NC}"
        echo -e "${BLUE}│${NC} ${DIM}Backend URL:${NC} ${BACKEND_URL}"
    fi
    
    echo -e "${BLUE}│${NC}"
    echo -e "${BLUE}│${NC} ${DIM}Production Site:${NC} https://v0-planetary-agents1.vercel.app"
    echo -e "${BLUE}╰─${NC}"
}

# Function to display footer
display_footer() {
    echo ""
    echo -e "${CYAN}╭────────────────────────────────────────────────────────────────────────────╮${NC}"
    echo -e "${CYAN}│${NC} ${DIM}Last Update:${NC} $(timestamp)"
    echo -e "${CYAN}│${NC} ${DIM}Refresh Interval:${NC} ${REFRESH_INTERVAL}s"
    echo -e "${CYAN}│${NC} ${DIM}Press Ctrl+C to exit${NC}"
    echo -e "${CYAN}╰────────────────────────────────────────────────────────────────────────────╯${NC}"
}

# Main display function
display_dashboard() {
    clear
    display_header
    display_backend_section
    display_api_endpoints
    display_deployment_info
    display_footer
}

# Main monitoring loop
main() {
    echo -e "${BLUE}🚀 Starting Monitoring Dashboard...${NC}"
    sleep 1

    while true; do
        display_dashboard
        sleep $REFRESH_INTERVAL
    done
}

# Trap for clean exit
trap 'echo -e "\n${BLUE}👋 Dashboard stopped${NC}"; exit 0' INT TERM

# Run dashboard
main
