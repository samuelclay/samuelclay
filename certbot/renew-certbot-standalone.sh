#!/bin/bash

# Script for standalone certbot renewal without DNS validation
# This avoids DNSimple API issues by using HTTP validation

set -e

# Change to the correct directory
cd /home/sclay/samuelclay/certbot

# Stop nginx to free up port 80 for standalone validation
echo "Stopping nginx..."
docker-compose stop nginx

# Run certbot renewal in standalone mode with non-interactive flag
echo "Running certbot renewal..."
docker-compose run --rm -p 80:80 certbot certonly \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --no-eff-email \
    --keep-until-expiring \
    --expand \
    --non-interactive \
    --email samuel@ofbrooklyn.com \
    -d samuelclay.com \
    -d www.samuelclay.com \
    -v

# Note: Removed wildcard domain as standalone doesn't support it
# Wildcard domains require DNS validation

# Check if renewal created a new directory (e.g., samuelclay.com-0001)
if [ -d "/var/lib/docker/volumes/samuelclay_certs/_data/live/samuelclay.com-0001" ]; then
    echo "New certificate directory detected, updating symlinks..."
    docker-compose run --rm --entrypoint sh certbot -c '
        rm -f /etc/letsencrypt/live/samuelclay.com/*.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/fullchain.pem /etc/letsencrypt/live/samuelclay.com/fullchain.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/privkey.pem /etc/letsencrypt/live/samuelclay.com/privkey.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/chain.pem /etc/letsencrypt/live/samuelclay.com/chain.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/cert.pem /etc/letsencrypt/live/samuelclay.com/cert.pem
    '
fi

# Start nginx back up
echo "Starting nginx..."
docker-compose start nginx

echo "Renewal process completed!"