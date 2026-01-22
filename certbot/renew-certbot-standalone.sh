#!/bin/bash

# Script for standalone certbot renewal without DNS validation
# This avoids DNSimple API issues by using HTTP validation

# Change to the main project directory (not certbot subdir)
# This ensures we use the main docker-compose.yml and share volumes with nginx
cd /srv/samuelclay

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
sleep 2

# Run certbot renewal in standalone mode with non-interactive flag
echo "Running certbot renewal..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm -p 80:80 certbot certonly \
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
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm --entrypoint sh certbot -c '
        rm -f /etc/letsencrypt/live/samuelclay.com/*.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/fullchain.pem /etc/letsencrypt/live/samuelclay.com/fullchain.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/privkey.pem /etc/letsencrypt/live/samuelclay.com/privkey.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/chain.pem /etc/letsencrypt/live/samuelclay.com/chain.pem
        ln -s /etc/letsencrypt/live/samuelclay.com-0001/cert.pem /etc/letsencrypt/live/samuelclay.com/cert.pem
    '
fi

# Note: nginx restart is handled by the EXIT trap above
echo "Renewal process completed!"