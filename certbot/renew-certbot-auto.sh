#!/bin/bash

# Automated CertBot renewal script
# This script uses certbot renew which automatically handles certificate renewal
# when certificates are within 30 days of expiration

set -e

# Change to the correct directory
cd /home/sclay/samuelclay/certbot

echo "Starting automated certificate renewal check..."

# Stop nginx to free up port 80 for standalone validation
echo "Stopping nginx..."
docker-compose stop nginx

# Run certbot renewal using the renew command
# This will only renew certificates that are within 30 days of expiration
echo "Checking and renewing certificates if needed..."
docker-compose run --rm -p 80:80 certbot renew \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --expand \
    -v

# Start nginx back up
echo "Starting nginx..."
docker-compose start nginx

echo "Certificate renewal check completed!"

# Optional: Send notification on successful renewal
# You can add email notification or logging here if needed