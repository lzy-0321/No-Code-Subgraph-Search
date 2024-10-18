#!/bin/bash

# Function to handle termination signals (like CTRL+C)
terminate() {
  echo "Terminating backend and frontend..."
  kill 0  # Kill all processes in the current script's process group
  exit 0
}

# Trap the SIGINT signal (sent by CTRL+C) and call the terminate function
trap terminate SIGINT

# Start Django backend on port 8080
echo "Starting Django backend..."
cd backend || exit 1  # Enter backend directory
python3 manage.py runserver 8000 &  # Run Django on port 8080 in the background
DJANGO_PID=$!  # Capture Django's process ID

# Start Next.js frontend
echo "Starting Next.js frontend..."
cd ../frontend || exit 1  # Enter frontend directory
npm run dev &  # Run Next.js in the background
NEXT_PID=$!  # Capture Next.js process ID

# Wait for both processes to run
wait $DJANGO_PID $NEXT_PID