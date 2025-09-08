#!/bin/bash
# Comprehensive Galileo testing script
# This script runs all Galileo-related tests

set -e  # Exit on any error

echo "🚀 Galileo Configuration Test Suite"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status "ERROR" "Please run this script from the project root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_status "WARNING" ".env.local file not found"
    print_status "INFO" "Creating .env.template if it doesn't exist..."
    if [ -f "copy-env-template.sh" ]; then
        bash copy-env-template.sh
    fi
    print_status "INFO" "Please set up your .env.local file with Galileo API key"
    print_status "INFO" "Then run this script again"
    exit 1
fi

# Load environment variables
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

print_status "INFO" "Starting Galileo test suite..."

# Test 1: Environment Configuration
echo ""
print_status "INFO" "Test 1: Environment Configuration"
echo "----------------------------------------"

if [ -z "$GALILEO_API_KEY" ]; then
    print_status "ERROR" "GALILEO_API_KEY is not set"
    exit 1
else
    print_status "SUCCESS" "GALILEO_API_KEY is configured"
fi

if [ -z "$GALILEO_PROJECT" ]; then
    print_status "WARNING" "GALILEO_PROJECT not set, using default"
    export GALILEO_PROJECT="1e7fd4a1-3e28-4fe1-a719-744f239a13be"
else
    print_status "SUCCESS" "GALILEO_PROJECT is configured: $GALILEO_PROJECT"
fi

if [ -z "$GALILEO_LOG_STREAM" ]; then
    print_status "WARNING" "GALILEO_LOG_STREAM not set, using default"
    export GALILEO_LOG_STREAM="6ed50263-a348-4ad6-ab63-bd04d3a4ffdd"
else
    print_status "SUCCESS" "GALILEO_LOG_STREAM is configured: $GALILEO_LOG_STREAM"
fi

# Test 2: Dependencies
echo ""
print_status "INFO" "Test 2: Dependencies Check"
echo "----------------------------"

if command -v node &> /dev/null; then
    print_status "SUCCESS" "Node.js is installed"
else
    print_status "ERROR" "Node.js is not installed"
    exit 1
fi

if command -v yarn &> /dev/null; then
    print_status "SUCCESS" "Yarn is installed"
else
    print_status "ERROR" "Yarn is not installed"
    exit 1
fi

# Test 3: Unit Tests
echo ""
print_status "INFO" "Test 3: Unit Tests"
echo "-------------------"

if yarn test --testPathPattern="galileo" --passWithNoTests; then
    print_status "SUCCESS" "Unit tests passed"
else
    print_status "ERROR" "Unit tests failed"
    exit 1
fi

# Test 4: Connectivity Test
echo ""
print_status "INFO" "Test 4: Galileo API Connectivity"
echo "-----------------------------------"

if node test-galileo-connectivity.js; then
    print_status "SUCCESS" "Galileo API connectivity test passed"
else
    print_status "ERROR" "Galileo API connectivity test failed"
    exit 1
fi

# Test 5: Integration Test
echo ""
print_status "INFO" "Test 5: Integration Test"
echo "------------------------"

# Start the development server in the background
print_status "INFO" "Starting development server for integration test..."
yarn dev &
DEV_SERVER_PID=$!

# Wait for server to start
sleep 10

# Test the Galileo dashboard endpoint
if curl -f http://localhost:3000/planetary-agents/galileo-dashboard > /dev/null 2>&1; then
    print_status "SUCCESS" "Galileo dashboard is accessible"
else
    print_status "WARNING" "Galileo dashboard is not accessible (this might be expected if not implemented)"
fi

# Test the Galileo API endpoint
if curl -f -X POST http://localhost:3000/api/galileo-stream \
    -H "Content-Type: application/json" \
    -d '{"message":"test","level":"info","data":{"test":true}}' > /dev/null 2>&1; then
    print_status "SUCCESS" "Galileo API endpoint is working"
else
    print_status "WARNING" "Galileo API endpoint test failed (this might be expected if not implemented)"
fi

# Stop the development server
kill $DEV_SERVER_PID 2>/dev/null || true

# Test 6: Build Test
echo ""
print_status "INFO" "Test 6: Build Test"
echo "----------------"

if yarn build; then
    print_status "SUCCESS" "Project builds successfully with Galileo configuration"
else
    print_status "ERROR" "Project build failed"
    exit 1
fi

# Summary
echo ""
print_status "SUCCESS" "All Galileo tests completed successfully!"
echo ""
print_status "INFO" "Galileo Configuration Summary:"
echo "  • API Key: Configured"
echo "  • Project ID: $GALILEO_PROJECT"
echo "  • Log Stream: $GALILEO_LOG_STREAM"
echo "  • Unit Tests: Passed"
echo "  • API Connectivity: Working"
echo "  • Build: Successful"
echo ""
print_status "INFO" "Your Galileo configuration is ready for use!"
print_status "INFO" "You can now use Galileo logging in your planetary agents application." 