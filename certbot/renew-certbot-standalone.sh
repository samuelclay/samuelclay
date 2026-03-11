#!/bin/bash

# Certbot SSL renewal for samuelclay.com
# Uses 'certbot renew' which reads existing renewal config and only
# renews certs within 45 days of expiration. Uses standalone HTTP
# validation, so nginx must be stopped to free port 80.
#
# Called by cron twice daily (see setup-certbot-cron.sh)

# Prevent duplicate runs with a lockfile
LOCKFILE="/tmp/certbot-renew.lock"
exec 200>"$LOCKFILE"
if ! flock -n 200; then
    echo "$(date): Another renewal is already running, skipping."
    exit 0
fi

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

# Check if cert expires within 45 days and force renewal if so.
# certbot's default threshold is 30 days, so we check ourselves.
EXPIRY=$(docker run --rm \
    -v samuelclay_certs:/etc/letsencrypt \
    certbot/certbot certificates 2>/dev/null \
    | grep "Expiry Date" | sed 's/.*: //' | sed 's/ (.*//')
RENEW_FLAG=""
if [ -n "$EXPIRY" ]; then
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
    echo "$(date): Certificate expires in $DAYS_LEFT days ($EXPIRY)"
    if [ "$DAYS_LEFT" -le 45 ]; then
        echo "$(date): Within 45-day window, forcing renewal..."
        RENEW_FLAG="--force-renewal"
    else
        echo "$(date): More than 45 days remaining, skipping."
        exit 0
    fi
fi

echo "$(date): Running certbot renew..."
docker run --rm -p 80:80 \
    -v samuelclay_certs:/etc/letsencrypt \
    certbot/certbot renew \
    --non-interactive $RENEW_FLAG

echo "$(date): Renewal process completed!"
