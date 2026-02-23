#!/bin/bash

# SignBridge Development Startup Script
# This runs both the Backend and Frontend in parallel.

# Function to handle cleanup on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Stopping SignBridge services..."
    # Kill all background processes started by this script
    kill $(jobs -p)
    exit
}

# Trap interrupt signals
trap cleanup SIGINT SIGTERM

echo "---------------------------------------"
echo "🌟 Starting SignBridge Full Stack App 🌟"
echo "---------------------------------------"

# Pre-start cleanup: Kill existing processes on ports and remove locks
echo "🧹 Cleaning up existing processes and locks..."
lsof -ti:3000,5001 | xargs kill -9 2>/dev/null
rm -f frontend/.next/dev/lock 2>/dev/null
sleep 1

# 1. Start Backend
echo "🚀 [1/2] Starting Backend Server..."
(cd backend && npm run dev) &

# 2. Start Frontend
echo "💻 [2/2] Starting Frontend Next.js App..."
(cd frontend && npm run dev) &

echo "---------------------------------------"
echo "✅ Both services are starting!"
echo "📡 Backend: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both."
echo "---------------------------------------"

# Wait for background processes to keep the script alive
wait
