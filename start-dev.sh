#!/bin/bash

# Visual AI Programmer Development Startup Script

echo "🚀 Starting Visual AI Programmer Development Environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down development environment..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if backend virtual environment is set up
if [ ! -d "apps/backend/venv" ]; then
    echo "🐍 Backend virtual environment not found. Setting up..."
    cd apps/backend
    ./setup-venv.sh
    if [ $? -ne 0 ]; then
        echo "❌ Failed to set up backend virtual environment!"
        exit 1
    fi
    cd ../..
fi

# Start backend with virtual environment
echo "🐍 Starting Python backend with virtual environment..."
cd apps/backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "⚛️ Starting React frontend..."
cd apps/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

echo "✅ Development environment started!"
echo "📱 Frontend: http://localhost:5173 (Vite default port)"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait 