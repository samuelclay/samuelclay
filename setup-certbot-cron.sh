#!/bin/bash

# Script to set up the certbot renewal cron job
# This should be run on the server after deploying the new scripts

echo "Setting up certbot renewal cron job..."

# Create the log directory if it doesn't exist
sudo mkdir -p /var/log
sudo touch /var/log/renew_certbot.log
sudo chmod 666 /var/log/renew_certbot.log

# Add the cron job (runs daily at 3 AM)
(crontab -l 2>/dev/null | grep -v "renew-certbot"; echo "0 3 * * * /bin/bash ~/samuelclay/renew-certbot-standalone.sh >> /var/log/renew_certbot.log 2>&1") | crontab -

echo "Cron job installed. Current crontab:"
crontab -l | grep certbot

echo "Done! The certbot renewal will run daily at 3 AM."