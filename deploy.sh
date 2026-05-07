#!/bin/bash

# InfraPilot Automatic Deployment Script

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest changes from Git..."
git pull origin main

# 2. Activate virtual environment
echo "🐍 Activating environment..."
source venv/bin/activate

# 3. Apply database migrations
echo "🗄️ Running migrations..."
python manage.py migrate

# 4. Track the deployment
echo "📝 Tracking deployment history..."
python manage.py track_deployment

echo "✅ Deployment Successful!"
