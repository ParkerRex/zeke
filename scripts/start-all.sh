#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(dirname "$0")"

echo "Starting all Zeke services..."
echo ""

# Start Redis first
"$SCRIPT_DIR/start-redis.sh"
echo ""

# Start services in background
"$SCRIPT_DIR/start-api.sh" &
API_PID=$!

"$SCRIPT_DIR/start-dashboard.sh" &
DASH_PID=$!

echo ""
echo "✓ Services started"
echo "  API:       http://localhost:3003 (PID: $API_PID)"
echo "  Dashboard: http://localhost:3000 (PID: $DASH_PID)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping...'; kill $API_PID $DASH_PID 2>/dev/null; exit" INT TERM

wait
