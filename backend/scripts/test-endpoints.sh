#!/bin/bash
# Comprehensive API Endpoint Testing Script
# Tests all backend endpoints (local or deployed)

set -e

# Configuration - Use BACKEND_URL env var or default to localhost
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -n "Testing $name... "

    local start_time=$(date +%s%N)
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))

    local http_code=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✓ OK${NC} (${response_time}ms)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        return 1
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Planetary Agents - API Endpoint Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if backend is accessible
if ! curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Backend not accessible at $BACKEND_URL${NC}"
    echo -e "${YELLOW}Start backend with: ./backend/scripts/start-production.sh${NC}"
    echo -e "${YELLOW}Or set BACKEND_URL environment variable for deployed backend${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend URL: $BACKEND_URL${NC}"
echo ""

passed=0
failed=0

# Health Check
echo -e "${BLUE}── Health & Status ──${NC}"
if test_endpoint "Health Check" "GET" "$BACKEND_URL/api/health" ""; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Root Endpoint" "GET" "$BACKEND_URL/" ""; then
    ((passed++))
else
    ((failed++))
fi
echo ""

# Planetary Hours
echo -e "${BLUE}── Planetary Hours ──${NC}"
if test_endpoint "Current Planetary Hour" "POST" "$BACKEND_URL/api/planetary/current-hour" \
    '{"location":{"lat":40.7128,"lon":-74.0060}}'; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Planetary Forecast" "POST" "$BACKEND_URL/api/planetary/forecast" \
    '{"startDate":"2025-10-07T00:00:00Z","endDate":"2025-10-07T23:59:59Z","location":{"lat":40.7128,"lon":-74.0060},"interval":60}'; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Optimal Times" "POST" "$BACKEND_URL/api/planetary/optimal-times" \
    '{"date":"2025-10-07T00:00:00Z","location":{"lat":40.7128,"lon":-74.0060},"targetPlanet":"Sun"}'; then
    ((passed++))
else
    ((failed++))
fi
echo ""

# Thermodynamics
echo -e "${BLUE}── Thermodynamics ──${NC}"
if test_endpoint "Thermodynamics Calculation" "POST" "$BACKEND_URL/api/alchemy/thermodynamics" \
    '{"elementalValues":{"spirit":1.0,"essence":0.8,"matter":0.6,"substance":0.4,"fire":0.5,"water":0.7,"air":0.3,"earth":0.9}}'; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Batch Thermodynamics" "POST" "$BACKEND_URL/api/alchemy/batch-thermodynamics" \
    '{"inputSets":[{"spirit":1.0,"essence":0.8,"matter":0.6,"substance":0.4,"fire":0.5,"water":0.7,"air":0.3,"earth":0.9},{"spirit":0.5,"essence":0.5,"matter":0.5,"substance":0.5,"fire":0.5,"water":0.5,"air":0.5,"earth":0.5}]}'; then
    ((passed++))
else
    ((failed++))
fi
echo ""

# Token Calculations
echo -e "${BLUE}── Token Calculations ──${NC}"
if test_endpoint "Token Calculate" "POST" "$BACKEND_URL/api/tokens/calculate" \
    '{"tokens":{"Spirit":1.0,"Essence":0.8,"Matter":0.6,"Substance":0.4},"location":{"lat":40.7128,"lon":-74.0060}}'; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Historical Token Data" "POST" "$BACKEND_URL/api/tokens/historical" \
    '{"startDate":"2025-10-01T00:00:00Z","endDate":"2025-10-07T23:59:59Z","location":{"lat":40.7128,"lon":-74.0060},"interval":86400}'; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Token Projections" "POST" "$BACKEND_URL/api/tokens/projections" \
    '{"location":{"lat":40.7128,"lon":-74.0060},"timeframe":"nearTerm"}'; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Token Events" "POST" "$BACKEND_URL/api/tokens/events" \
    '{"location":{"lat":40.7128,"lon":-74.0060},"lookAhead":24}'; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Token Info" "GET" "$BACKEND_URL/api/tokens/info" ""; then
    ((passed++))
else
    ((failed++))
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
total=$((passed + failed))
echo -e "Total Tests: $total"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    exit 1
fi
