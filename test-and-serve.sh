#!/bin/bash
# Revideo Renderer Test Script
# Usage: ./test-and-serve.sh

set -e

PORT=${PORT:-8000}
API_URL="http://localhost:$PORT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_msg() {
    local symbol=$1
    local message=$2
    local color=$3
    echo -e "${color}${symbol} ${message}${NC}"
}

wait_for_server() {
    log_msg "⏳" "Waiting for server to start..." "$CYAN"
    
    for i in {1..60}; do
        if curl -s "$API_URL/health" > /dev/null 2>&1; then
            log_msg "✅" "Server is ready!" "$GREEN"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    
    echo ""
    log_msg "❌" "Server failed to start" "$RED"
    return 1
}

test_render() {
    log_msg "🎬" "Sending render request..." "$CYAN"
    
    local response=$(curl -s -X POST "$API_URL/render" \
        -H "Content-Type: application/json" \
        -d '{"input": {"variables": {"headline": "Test Render from Script"}}}')
    
    local status=$(echo "$response" | jq -r '.status // empty')
    
    if [ "$status" = "completed" ]; then
        local output_path=$(echo "$response" | jq -r '.output.output_path // empty')
        local file_size=$(echo "$response" | jq -r '.output.file_size // empty')
        local output_url=$(echo "$response" | jq -r '.output.output_url // empty')
        
        log_msg "✅" "Render succeeded!" "$GREEN"
        log_msg "📁" "Output: $output_path" "$GREEN"
        log_msg "📊" "File size: $file_size bytes" "$GREEN"
        log_msg "🌐" "URL: $output_url" "$BLUE"
        return 0
    else
        local error=$(echo "$response" | jq -r '.output.error // empty')
        log_msg "❌" "Render failed" "$RED"
        log_msg "💥" "$error" "$RED"
        
        local error_stack=$(echo "$response" | jq -r '.output.error_stack // empty')
        if [ ! -z "$error_stack" ]; then
            echo "$error_stack"
        fi
        return 1
    fi
}

# Main
log_msg "🚀" "Starting Revideo Renderer Server..." "$CYAN"
echo ""

# Start server in background
node dist/handler.js &
SERVER_PID=$!

# Trap to kill server on exit
trap "kill $SERVER_PID 2>/dev/null || true" EXIT

# Wait for server to be ready
if ! wait_for_server; then
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Run test
if test_render; then
    echo ""
    log_msg "═══════════════════════════════════════════" "" "$CYAN"
    echo ""
    log_msg "ℹ️" "Server is still running on port $PORT" "$GREEN"
    log_msg "ℹ️" "Press Ctrl+C to stop" "$YELLOW"
    echo ""
    
    # Keep server running
    wait $SERVER_PID
else
    log_msg "❌" "Test failed, stopping server" "$RED"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
