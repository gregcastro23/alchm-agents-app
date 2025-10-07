#!/bin/bash
# Comprehensive Backend & ngrok Monitoring Dashboard
# Real-time statistics, performance metrics, and health monitoring

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
BACKEND_PORT=8000
NGROK_API="http://127.0.0.1:4040/api"
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
    curl -s "http://localhost:${BACKEND_PORT}/api/health" 2>/dev/null || echo '{"status":"offline"}'
}

# Function to get ngrok tunnel info
get_ngrok_info() {
    curl -s "${NGROK_API}/tunnels" 2>/dev/null || echo '{"tunnels":[]}'
}

# Function to test ngrok connectivity
test_ngrok_connectivity() {
    local url=$1
    if [ -z "$url" ]; then
        echo "NO_URL"
        return 1
    fi

    local start_time=$(date +%s%N)
    if curl -s -f -m 5 "${url}/api/health" -o /dev/null 2>/dev/null; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        echo "OK|${response_time}"
        return 0
    else
        echo "FAILED"
        return 1
    fi
}

# Function to display header
display_header() {
    echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║      PLANETARY AGENTS - PRODUCTION MONITORING DASHBOARD v1.0            ║${NC}"
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
        "healthy")
            echo -e "${CYAN}│${NC} ${GREEN}${CHECK}${NC} ${BOLD}Status:${NC} ${GREEN}HEALTHY${NC}"
            ;;
        "degraded")
            echo -e "${CYAN}│${NC} ${YELLOW}${STAR}${NC} ${BOLD}Status:${NC} ${YELLOW}DEGRADED${NC}"
            ;;
        "offline")
            echo -e "${CYAN}│${NC} ${RED}${CROSS}${NC} ${BOLD}Status:${NC} ${RED}OFFLINE${NC}"
            echo -e "${CYAN}│${NC}"
            echo -e "${CYAN}│${NC} ${RED}Backend is not responding on port ${BACKEND_PORT}${NC}"
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
    echo -e "${CYAN}│${NC} ${DIM}Port:${NC} ${BACKEND_PORT}"
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
    local cache_type=$(echo "$health" | grep -o '"cache":{"type":"[^"]*' | cut -d'"' -f6)
    if [ ! -z "$cache_type" ]; then
        echo -e "${CYAN}│${NC} ${DIM}Cache:${NC} ${cache_type}"
    fi

    echo -e "${CYAN}╰─${NC}"
}

# Function to display ngrok section
display_ngrok_section() {
    local ngrok_data=$(get_ngrok_info)
    local url=$(echo "$ngrok_data" | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

    echo ""
    echo -e "${BOLD}${MAGENTA}╭─ ngrok Tunnel Status${NC}"
    echo -e "${MAGENTA}│${NC}"

    if [ -z "$url" ]; then
        echo -e "${MAGENTA}│${NC} ${RED}${CROSS}${NC} ${BOLD}Status:${NC} ${RED}DISCONNECTED${NC}"
        echo -e "${MAGENTA}│${NC}"
        echo -e "${MAGENTA}│${NC} ${YELLOW}No active ngrok tunnel detected${NC}"
        echo -e "${MAGENTA}│${NC} ${DIM}Run: ./scripts/start-ngrok-persistent.sh${NC}"
        echo -e "${MAGENTA}╰─${NC}"
        return
    fi

    # Test connectivity
    local connectivity=$(test_ngrok_connectivity "$url")
    IFS='|' read -r conn_status conn_time <<< "$connectivity"

    case $conn_status in
        "OK")
            echo -e "${MAGENTA}│${NC} ${GREEN}${CHECK}${NC} ${BOLD}Status:${NC} ${GREEN}CONNECTED & HEALTHY${NC}"
            echo -e "${MAGENTA}│${NC} ${DIM}Response Time:${NC} ${GREEN}${conn_time}ms${NC}"
            ;;
        "FAILED")
            echo -e "${MAGENTA}│${NC} ${YELLOW}${STAR}${NC} ${BOLD}Status:${NC} ${YELLOW}CONNECTED BUT UNHEALTHY${NC}"
            ;;
        "NO_URL")
            echo -e "${MAGENTA}│${NC} ${RED}${CROSS}${NC} ${BOLD}Status:${NC} ${RED}NO URL${NC}"
            echo -e "${MAGENTA}╰─${NC}"
            return
            ;;
    esac

    echo -e "${MAGENTA}│${NC} ${DIM}Public URL:${NC}"
    echo -e "${MAGENTA}│${NC}   ${GREEN}${url}${NC}"

    # Connection metrics
    local conns=$(echo "$ngrok_data" | grep -o '"count":[0-9]*' | head -1 | cut -d':' -f2)
    local http_count=$(echo "$ngrok_data" | grep -o '"http":{"count":[0-9]*' | grep -o '[0-9]*')

    if [ ! -z "$conns" ]; then
        echo -e "${MAGENTA}│${NC} ${DIM}Total Connections:${NC} ${conns}"
    fi
    if [ ! -z "$http_count" ]; then
        echo -e "${MAGENTA}│${NC} ${DIM}HTTP Requests:${NC} ${http_count}"
    fi

    echo -e "${MAGENTA}╰─${NC}"
}

# Function to display API endpoints
display_api_endpoints() {
    local ngrok_data=$(get_ngrok_info)
    local url=$(echo "$ngrok_data" | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

    if [ -z "$url" ]; then
        return
    fi

    echo ""
    echo -e "${BOLD}${GREEN}╭─ API Endpoints${NC}"
    echo -e "${GREEN}│${NC}"
    echo -e "${GREEN}│${NC} ${DIM}Health:${NC}         ${url}/api/health"
    echo -e "${GREEN}│${NC} ${DIM}Planetary:${NC}      ${url}/api/planetary/current-hour"
    echo -e "${GREEN}│${NC} ${DIM}Thermodynamics:${NC} ${url}/api/alchemy/thermodynamics"
    echo -e "${GREEN}│${NC} ${DIM}Tokens:${NC}         ${url}/api/tokens/calculate"
    echo -e "${GREEN}│${NC} ${DIM}Kinetics:${NC}       ${url}/api/kinetics/evolution"
    echo -e "${GREEN}╰─${NC}"
}

# Function to display Vercel integration
display_vercel_integration() {
    local ngrok_data=$(get_ngrok_info)
    local current_url=$(echo "$ngrok_data" | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

    echo ""
    echo -e "${BOLD}${BLUE}╭─ Vercel Integration${NC}"
    echo -e "${BLUE}│${NC}"

    if [ -z "$current_url" ]; then
        echo -e "${BLUE}│${NC} ${RED}${CROSS}${NC} ${BOLD}Status:${NC} ${RED}UNAVAILABLE${NC}"
        echo -e "${BLUE}│${NC} ${DIM}Waiting for ngrok tunnel...${NC}"
        echo -e "${BLUE}╰─${NC}"
        return
    fi

    # Get Vercel env var
    local vercel_url=$(vercel env ls 2>/dev/null | grep "NEXT_PUBLIC_BACKEND_URL" | awk '{print $2}' | head -1 || echo "")

    if [ "$vercel_url" == "Encrypted" ] || [ -z "$vercel_url" ]; then
        # Try to pull from Vercel
        echo -e "${BLUE}│${NC} ${YELLOW}${STAR}${NC} ${BOLD}Status:${NC} ${YELLOW}CHECKING...${NC}"
    elif [ "$vercel_url" == "$current_url" ]; then
        echo -e "${BLUE}│${NC} ${GREEN}${CHECK}${NC} ${BOLD}Status:${NC} ${GREEN}SYNCHRONIZED${NC}"
        echo -e "${BLUE}│${NC} ${DIM}Production URL:${NC} https://v0-planetary-agents1.vercel.app"
    else
        echo -e "${BLUE}│${NC} ${YELLOW}${STAR}${NC} ${BOLD}Status:${NC} ${YELLOW}OUT OF SYNC${NC}"
        echo -e "${BLUE}│${NC}"
        echo -e "${BLUE}│${NC} ${DIM}Current Tunnel:${NC}"
        echo -e "${BLUE}│${NC}   ${current_url}"
        echo -e "${BLUE}│${NC}"
        echo -e "${BLUE}│${NC} ${YELLOW}Action required:${NC}"
        echo -e "${BLUE}│${NC}   ${DIM}echo \"${current_url}\" | vercel env add NEXT_PUBLIC_BACKEND_URL production${NC}"
    fi

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
    display_ngrok_section
    display_api_endpoints
    display_vercel_integration
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
