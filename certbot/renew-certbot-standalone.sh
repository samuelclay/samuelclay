#!/bin/bash

# Certbot SSL renewal for samuelclay.com
# Uses 'certbot renew' which reads existing renewal config and only
# renews certs within 30 days of expiration. Uses standalone HTTP
# validation, so nginx must be stopped to free port 80.
#
# Called by cron twice daily (see setup-certbot-cron.sh)

echo "$(date): Starting certbot renewal check..."

# Ensure nginx is ALWAYS restarted, even if certbot fails
restart_nginx() {
    echo "$(date): Starting nginx..."
    docker start samuelclay-nginx || true
    echo "$(date): Nginx started."
}
trap restart_nginx EXIT

# Stop nginx to free up port 80 for standalone validation
echo "$(date): Stopping nginx..."
docker stop samuelclay-nginx || true
sleep 3

# Use 'certbot renew' instead of 'certbot certonly' to avoid creating
# duplicate certs with suffixed names (e.g. samuelclay.com-0002).
# The renew command reads /etc/letsencrypt/renewal/samuelclay.com.conf
# which already has the correct domains and authenticator settings.
echo "$(date): Running certbot renew..."
docker run --rm -p 80:80 \
    -v samuelclay_certs:/etc/letsencrypt \
    certbot/certbot renew \
    --non-interactive

echo "$(date): Renewal process completed!"
