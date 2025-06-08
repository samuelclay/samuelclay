# Certbot SSL Certificate Renewal Setup

This directory contains scripts for automatic SSL certificate renewal using Let's Encrypt certbot in standalone mode.

## Files

- `renew-certbot-standalone.sh` - Main renewal script that uses HTTP validation (port 80)
- `setup-certbot-cron.sh` - Sets up the cron job for automatic renewal
- `docker-compose.yml` - Updated to use standard certbot instead of dns-dnsimple

## Why Standalone Mode?

We switched from DNS validation (dns-dnsimple) to standalone HTTP validation because:
1. DNS validation was failing with API errors (400 Bad Request)
2. Standalone mode is more reliable and doesn't depend on external APIs
3. It only requires port 80 to be free temporarily during renewal

## Setup Instructions

1. Deploy these files to the server:
   ```bash
   scp renew-certbot-standalone.sh setup-certbot-cron.sh docker-compose.yml samuelclay.com:~/samuelclay/
   ```

2. SSH into the server and run the setup script:
   ```bash
   ssh samuelclay.com
   cd ~/samuelclay
   ./setup-certbot-cron.sh
   ```

3. The renewal will run automatically every day at 3 AM

## Manual Renewal

To manually renew the certificate:
```bash
cd ~/samuelclay
./renew-certbot-standalone.sh
```

## How It Works

1. The script stops nginx to free port 80
2. Runs certbot in standalone mode for renewal
3. Updates symlinks if a new certificate directory is created
4. Restarts nginx with the new certificate

## Monitoring

Check the renewal log:
```bash
tail -f /var/log/renew_certbot.log
```

Check certificate expiration:
```bash
echo | openssl s_client -servername samuelclay.com -connect samuelclay.com:443 2>/dev/null | openssl x509 -noout -dates
```