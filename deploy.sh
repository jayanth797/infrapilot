#!/bin/bash

echo "🚀 Starting Deployment Workflow..."

# 1. Pull latest code
echo "📥 Pulling latest code from Git..."
git pull origin main

# 2. Activate virtual environment
echo "🐍 Activating environment..."
source venv/bin/activate

# 3. Apply database migrations
echo "🗄️ Applying migrations..."
python manage.py migrate

# 4. Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --no-input

# 5. Track deployment automatically
echo "📝 Tracking deployment in history..."
python manage.py track_deployment

# 6. Restart production services (if applicable)
echo "🔄 Restarting services..."
if systemctl is-active --quiet infrapilot; then
    sudo systemctl restart infrapilot
    echo "✅ Gunicorn restarted."
fi

echo "✅ Deployment complete!"
