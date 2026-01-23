#!/bin/bash

# Script for standalone certbot renewal without DNS validation
# This avoids DNSimple API issues by using HTTP validation

# Ensure nginx is ALWAYS restarted, even if certbot fails
restart_nginx() {
    echo "Starting nginx..."
    docker start samuelclay-nginx || true
    echo "Nginx restarted."
}
trap restart_nginx EXIT

# Stop nginx to free up port 80 for standalone validation
echo "Stopping nginx..."
docker stop samuelclay-nginx || true
# Wait for port to be fully released
sleep 3

# Run certbot renewal using docker run directly (avoids docker-compose issues)
echo "Running certbot renewal..."
docker run --rm -p 80:80 \
    -v samuelclay_certs:/etc/letsencrypt \
    certbot/certbot certonly \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --no-eff-email \
    --keep-until-expiring \
    --expand \
    --non-interactive \
    --email samuel@ofbrooklyn.com \
    -d samuelclay.com \
    -d www.samuelclay.com

# Note: nginx restart is handled by the EXIT trap above
echo "Renewal process completed!"
