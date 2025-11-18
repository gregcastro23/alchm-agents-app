#!/bin/bash

# Test script for Alchemical Kinetics API
# Tests all endpoints: /api/kinetics/alchemical, /api/kinetics/alchemical-timeline, /api/kinetics/status

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🧪 Testing Alchemical Kinetics API"
echo "Backend URL: $BACKEND_URL"
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check kinetics status
echo -e "\n${BLUE}Test 1: GET /api/kinetics/status${NC}"
STATUS_RESPONSE=$(curl -s "$BACKEND_URL/api/kinetics/status")
echo "$STATUS_RESPONSE" | jq '.'

if echo "$STATUS_RESPONSE" | jq -e '.success == true and .data.features.alchemicalKinetics == true' > /dev/null; then
    echo -e "${GREEN}✓ Status endpoint working - Alchemical kinetics enabled${NC}"
else
    echo -e "${RED}✗ Status endpoint failed or alchemical kinetics not enabled${NC}"
fi

# Test 2: Calculate alchemical kinetics (single state)
echo -e "\n${BLUE}Test 2: POST /api/kinetics/alchemical (single state)${NC}"
KINETICS_PAYLOAD='{
  "current": {
    "spirit": 0.7,
    "essence": 0.6,
    "matter": 0.5,
    "substance": 0.4,
    "elementals": {
      "Fire": 6.5,
      "Water": 5.2,
      "Air": 7.1,
      "Earth": 4.8
    },
    "timestamp": "'$TIMESTAMP'"
  },
  "previous": null,
  "location": {
    "lat": 40.7128,
    "lon": -74.0060
  }
}'

echo "Payload:"
echo "$KINETICS_PAYLOAD" | jq '.'

KINETICS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/kinetics/alchemical" \
  -H "Content-Type: application/json" \
  -d "$KINETICS_PAYLOAD")

echo "Response:"
echo "$KINETICS_RESPONSE" | jq '.'

if echo "$KINETICS_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Alchemical kinetics calculation successful${NC}"

    # Extract key metrics
    VELOCITY=$(echo "$KINETICS_RESPONSE" | jq -r '.data.velocity.magnitude')
    MOMENTUM=$(echo "$KINETICS_RESPONSE" | jq -r '.data.momentum.magnitude')
    FORCE_TYPE=$(echo "$KINETICS_RESPONSE" | jq -r '.data.force.type')
    FLOW_TYPE=$(echo "$KINETICS_RESPONSE" | jq -r '.data.flowState.type')
    RESONANCE=$(echo "$KINETICS_RESPONSE" | jq -r '.data.resonance.quality')
    RHYTHM=$(echo "$KINETICS_RESPONSE" | jq -r '.data.temporalPressure.rhythm')

    echo -e "\n${BLUE}Kinetics Summary:${NC}"
    echo "  Velocity Magnitude: $VELOCITY"
    echo "  Momentum Magnitude: $MOMENTUM"
    echo "  Force Type: $FORCE_TYPE"
    echo "  Flow Type: $FLOW_TYPE"
    echo "  Resonance Quality: $RESONANCE"
    echo "  Temporal Rhythm: $RHYTHM"
else
    echo -e "${RED}✗ Alchemical kinetics calculation failed${NC}"
fi

# Test 3: Calculate alchemical kinetics (with previous state)
echo -e "\n${BLUE}Test 3: POST /api/kinetics/alchemical (with previous state)${NC}"

# Previous timestamp (1 hour ago)
PREV_TIMESTAMP=$(date -u -v-1H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '1 hour ago' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "2025-01-15T10:00:00Z")

KINETICS_WITH_PREV='{
  "current": {
    "spirit": 0.8,
    "essence": 0.7,
    "matter": 0.6,
    "substance": 0.5,
    "elementals": {
      "Fire": 7.5,
      "Water": 6.2,
      "Air": 8.1,
      "Earth": 5.8
    },
    "timestamp": "'$TIMESTAMP'"
  },
  "previous": {
    "spirit": 0.7,
    "essence": 0.6,
    "matter": 0.5,
    "substance": 0.4,
    "elementals": {
      "Fire": 6.5,
      "Water": 5.2,
      "Air": 7.1,
      "Earth": 4.8
    },
    "timestamp": "'$PREV_TIMESTAMP'"
  },
  "location": {
    "lat": 40.7128,
    "lon": -74.0060
  }
}'

KINETICS_PREV_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/kinetics/alchemical" \
  -H "Content-Type: application/json" \
  -d "$KINETICS_WITH_PREV")

echo "Response:"
echo "$KINETICS_PREV_RESPONSE" | jq '.'

if echo "$KINETICS_PREV_RESPONSE" | jq -e '.success == true and .metadata.hasPreviousState == true' > /dev/null; then
    echo -e "${GREEN}✓ Kinetics with previous state successful${NC}"

    # Check if we have actual force calculation (not zero)
    FORCE_MAG=$(echo "$KINETICS_PREV_RESPONSE" | jq -r '.data.force.magnitude')
    if [ "$FORCE_MAG" != "0" ]; then
        echo -e "${GREEN}✓ Force calculation working (magnitude: $FORCE_MAG)${NC}"
    else
        echo -e "${RED}✗ Force magnitude is zero (expected non-zero with previous state)${NC}"
    fi
else
    echo -e "${RED}✗ Kinetics with previous state failed${NC}"
fi

# Test 4: Calculate kinetics timeline
echo -e "\n${BLUE}Test 4: POST /api/kinetics/alchemical-timeline${NC}"

# Timeline for last 6 hours
START_DATE=$(date -u -v-6H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '6 hours ago' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "2025-01-15T06:00:00Z")
END_DATE="$TIMESTAMP"

TIMELINE_PAYLOAD='{
  "startDate": "'$START_DATE'",
  "endDate": "'$END_DATE'",
  "location": {
    "lat": 40.7128,
    "lon": -74.0060
  },
  "intervalHours": 1
}'

echo "Payload:"
echo "$TIMELINE_PAYLOAD" | jq '.'

TIMELINE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/kinetics/alchemical-timeline" \
  -H "Content-Type: application/json" \
  -d "$TIMELINE_PAYLOAD")

echo "Response (summary):"
echo "$TIMELINE_RESPONSE" | jq '{success, metadata, dataPointCount: (.data | length)}'

if echo "$TIMELINE_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Timeline calculation successful${NC}"

    DATA_POINTS=$(echo "$TIMELINE_RESPONSE" | jq -r '.metadata.dataPoints')
    AVG_VELOCITY=$(echo "$TIMELINE_RESPONSE" | jq -r '.metadata.statistics.averageVelocity // "N/A"')
    AVG_MOMENTUM=$(echo "$TIMELINE_RESPONSE" | jq -r '.metadata.statistics.averageMomentum // "N/A"')
    FLOW_DIST=$(echo "$TIMELINE_RESPONSE" | jq -r '.metadata.statistics.flowStateDistribution // {} | to_entries | map("\(.key): \(.value)") | join(", ")')

    echo -e "\n${BLUE}Timeline Summary:${NC}"
    echo "  Data Points: $DATA_POINTS"
    echo "  Average Velocity: $AVG_VELOCITY"
    echo "  Average Momentum: $AVG_MOMENTUM"
    echo "  Flow State Distribution: $FLOW_DIST"
else
    echo -e "${RED}✗ Timeline calculation failed${NC}"
fi

# Test 5: Test validation errors
echo -e "\n${BLUE}Test 5: Validation error handling${NC}"

INVALID_PAYLOAD='{
  "current": {
    "spirit": "invalid",
    "timestamp": "not-a-date"
  }
}'

VALIDATION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/kinetics/alchemical" \
  -H "Content-Type: application/json" \
  -d "$INVALID_PAYLOAD")

if echo "$VALIDATION_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1 || \
   echo "$VALIDATION_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Validation error handling working${NC}"
else
    echo -e "${RED}✗ Validation error handling not working properly${NC}"
fi

echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}Testing complete!${NC}"
echo ""
echo "Summary of implemented features:"
echo "  ✓ Elemental Velocity (Celeritas) - Mercury Principle"
echo "  ✓ Elemental Momentum (Impetus) - Mars + Saturn Synthesis"
echo "  ✓ Elemental Force (Vis) - Classical Force Principle"
echo "  ✓ Flow States - Jupiter (Expansion) + Saturn (Contraction)"
echo "  ✓ Resonance Fields - Harmonic and Discord"
echo "  ✓ Temporal Pressure - Solar and Lunar rhythms"
echo ""
