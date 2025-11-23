#!/bin/bash
# Vercel install script - excludes backend directory
# This prevents swisseph compilation on Vercel

echo "🔧 Hiding backend directory during install..."
if [ -d "backend" ]; then
  mv backend backend.vercel-temp
  echo "✅ Backend hidden"
fi

echo "📦 Installing frontend dependencies..."
yarn install --production=false

echo "🔄 Restoring backend directory..."
if [ -d "backend.vercel-temp" ]; then
  mv backend.vercel-temp backend
  echo "✅ Backend restored"
fi

echo "✅ Frontend dependencies installed successfully!"
