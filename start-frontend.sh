#!/bin/bash
echo "Starting Flight Booking Bot Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "Starting development server..."
npm run dev

