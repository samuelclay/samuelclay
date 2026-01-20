#!/bin/bash

# Script to set up automatic CertBot renewal via cron

echo "Setting up automatic CertBot renewal..."

# Check if the renewal script exists
if [ ! -f "/srv/samuelclay/certbot/renew-certbot-standalone.sh" ]; then
    echo "Error: renew-certbot-standalone.sh not found at /srv/samuelclay/certbot/"
    echo "Please ensure the script is deployed to the server first."
    exit 1
fi

# Add cron job for automatic renewal
# Runs twice daily at 3:00 AM and 3:00 PM to ensure certificates are renewed promptly
CRON_JOB="0 3,15 * * * /bin/bash /srv/samuelclay/certbot/renew-certbot-standalone.sh >> /var/log/renew_certbot.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "renew-certbot-standalone.sh"; then
    echo "Cron job for CertBot renewal already exists. Updating..."
    # Remove old cron job and add new one
    (crontab -l 2>/dev/null | grep -v "renew-certbot" ; echo "$CRON_JOB") | crontab -
else
    echo "Adding new cron job for CertBot renewal..."
    (crontab -l 2>/dev/null ; echo "$CRON_JOB") | crontab -
fi

echo "Cron job setup complete!"
echo "The renewal script will run twice daily at 3:00 AM and 3:00 PM."
echo ""
echo "To view the cron job, run: crontab -l"
echo "To view renewal logs, run: tail -f /var/log/renew_certbot.log"