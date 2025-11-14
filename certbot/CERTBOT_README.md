# CertBot SSL Certificate Renewal Setup

## Problem Fixed
The CertBot renewal was failing because it was prompting for interactive input "(E)xpand/(C)ancel" when trying to expand the certificate. This has been fixed by adding the `--non-interactive` flag to all CertBot commands.

## Files Created

1. **docker-compose.yml** - Docker configuration with CertBot service configured for non-interactive mode
2. **renew-certbot-standalone.sh** - Manual renewal script using `certonly` command with standalone validation
3. **renew-certbot-auto.sh** - Automated renewal script using `renew` command (recommended for cron)
4. **setup-certbot-cron.sh** - Script to set up automatic renewal via cron

## Deployment Instructions

1. **Push to Git Repository:**
   ```bash
   git add certbot/
   git commit -m "Fix CertBot non-interactive renewal issue"
   git push
   ```

2. **Deploy to Server:**
   SSH into the server and pull the latest changes:
   ```bash
   ssh samuelclay.com
   cd /home/sclay/samuelclay
   git pull
   ```

3. **Set Up Automatic Renewal:**
   Run the setup script on the server:
   ```bash
   cd certbot/
   ./setup-certbot-cron.sh
   ```

## How It Works

- **Automatic Renewal:** The `renew-certbot-auto.sh` script runs twice daily via cron (3 AM and 3 PM)
- **Non-Interactive:** All CertBot commands now include `--non-interactive` flag to prevent prompts
- **Standalone Validation:** Uses HTTP validation on port 80 (nginx is temporarily stopped during renewal)
- **Smart Renewal:** The `renew` command only renews certificates within 30 days of expiration

## Manual Testing

To test the renewal process manually:
```bash
ssh samuelclay.com
cd /home/sclay/samuelclay/certbot
./renew-certbot-auto.sh
```

## Monitoring

Check renewal logs:
```bash
ssh samuelclay.com
tail -f /var/log/renew_certbot.log
```

Check cron job:
```bash
ssh samuelclay.com
crontab -l | grep certbot
```

## Notes

- The wildcard certificate (*.samuelclay.com) requires DNS validation which was causing issues with DNSimple API
- The current setup only renews the main domain (samuelclay.com) using HTTP validation
- If wildcard support is needed in the future, consider using DNS validation with proper API credentials