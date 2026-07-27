#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define function to kill lingering node/vite processes
kill_processes() {
    pkill -f "node index.js" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    fuser -k 5001/tcp 2>/dev/null || true
    # Vite tries ports sequentially starting at 5173
    for port in {5173..5180}; do
        fuser -k $port/tcp 2>/dev/null || true
    done
    # Kill Windows-side node processes holding port 5001 or Vite ports if running in WSL environment
    cmd.exe /c "for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :5001') do taskkill /F /PID %a" 2>/dev/null || true
}

# Define cleanup function to terminate background tasks and stop docker compose
cleanup() {
    echo -e "\nStopping backend and frontend processes..."
    # Kill background jobs
    kill $(jobs -p) 2>/dev/null || true
    kill_processes
    
    echo "Stopping Docker containers..."
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        docker compose down
    fi
    exit 0
}

# Trap Ctrl+C (SIGINT), SIGTERM, SIGHUP, and EXIT to run cleanup
trap cleanup SIGHUP SIGINT SIGTERM

echo "Cleaning up any dangling processes from previous runs..."
kill_processes

# Check and install dependencies if node_modules are missing
if [ ! -d "backend/node_modules" ]; then
    echo "node_modules not found in backend/. Installing dependencies..."
    npm --prefix backend install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "node_modules not found in frontend/. Installing dependencies..."
    npm --prefix frontend install
fi

echo "Starting PostgreSQL database container..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

# Wait for database port to become active (Port 5434)
echo -n "Waiting for database to be ready on port 5434..."
for i in {1..15}; do
    if (echo > /dev/tcp/127.0.0.1/5434) >/dev/null 2>&1; then
        echo " Ready!"
        break
    fi
    echo -n "."
    sleep 1
done

# Start Backend in the background
echo "Starting backend server..."
npm --prefix backend run dev &

# Start Frontend in the background
echo "Starting frontend dev server..."
npm --prefix frontend run dev &

# Wait for all background processes to finish
wait
