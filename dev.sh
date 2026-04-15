#!/bin/bash

# SignBridge Development Startup Script
# This runs both the Backend and Frontend in parallel.

# Function to handle cleanup on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Stopping SignBridge services..."
    # Kill all background processes started by this script
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap interrupt signals
trap cleanup SIGINT SIGTERM

echo "---------------------------------------"
echo "🌟 Starting SignBridge Full Stack App 🌟"
echo "---------------------------------------"

# Pre-start checks
echo "🔍 Performing pre-start checks..."

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found! Copying from .env.example..."
    cp backend/.env.example backend/.env
fi

# Check for GEMINI_API_KEY
if ! grep -q "GEMINI_API_KEY" backend/.env || grep -q "your_gemini_api_key_here" backend/.env; then
    echo "🚨 WARNING: GEMINI_API_KEY is missing or not set in backend/.env"
    echo "   Sentence framing will fallback to simple word joining."
    echo "   Get a key at: https://aistudio.google.com/"
fi

# Check node_modules
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    (cd backend && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    (cd frontend && npm install)
fi

# Pre-start cleanup: Kill existing processes on ports and remove locks
echo "🧹 Cleaning up existing processes and locks..."
# Backend usually on 5000, Frontend on 3000
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
echo "📡 Backend: http://localhost:5001"
echo "🌐 Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both."
echo "---------------------------------------"

# Wait for background processes to keep the script alive
wait
