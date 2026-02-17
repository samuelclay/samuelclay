# CertBot SSL Certificate Renewal Setup

## How It Works

- **Automatic Renewal:** `renew-certbot-standalone.sh` runs twice daily via cron (3 AM and 3 PM)
- **Uses `certbot renew`:** Reads the existing renewal config at `/etc/letsencrypt/renewal/samuelclay.com.conf` and only renews when within 30 days of expiration
- **Standalone Validation:** Uses HTTP validation on port 80 (nginx is temporarily stopped during renewal)
- **Safety:** An EXIT trap ensures nginx is always restarted, even if certbot fails

## Files

1. **renew-certbot-standalone.sh** - Renewal script called by cron. Stops nginx, runs `certbot renew`, restarts nginx.
2. **setup-certbot-cron.sh** - Sets up the cron job on the server. Run once after deployment.

## Deployment

1. Push changes and pull on server:
   ```bash
   git push
   make ssh RUN="cd /srv/samuelclay && git pull"
   ```

2. Set up the cron job (only needed once, or to update):
   ```bash
   make ssh RUN="bash /srv/samuelclay/certbot/setup-certbot-cron.sh"
   ```

## Manual Testing

Dry-run (no actual renewal):
```bash
make ssh RUN="docker stop samuelclay-nginx && docker run --rm -p 80:80 -v samuelclay_certs:/etc/letsencrypt certbot/certbot renew --dry-run --non-interactive; docker start samuelclay-nginx"
```

Check certificate status:
```bash
make ssh RUN="docker run --rm -v samuelclay_certs:/etc/letsencrypt certbot/certbot certificates"
```

## Monitoring

```bash
# Check renewal logs
make ssh RUN="tail -20 /var/log/renew_certbot.log"

# Check cron job
make ssh RUN="crontab -l | grep certbot"
```

## Past Issues

- **Feb 2026:** Cert expired because cron was calling `renew-certbot-auto.sh` which didn't exist on the server. Also, using `certbot certonly --expand` created duplicate certs with suffixed names (`samuelclay.com-0002`) while nginx pointed to the original path. Fixed by switching to `certbot renew` which uses existing renewal config.
- **Sep 2024:** CertBot was prompting for interactive input. Fixed with `--non-interactive` flag.
