#!/usr/bin/env bash
# exit on error
set -o errexit

echo "===> Installing Python backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "===> Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "===> Deployment build completed successfully!"
