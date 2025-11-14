# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Samuel Clay's personal website (samuelclay.com) - a Django-based portfolio site that displays blog entries from ofbrooklyn.com via RSS feeds, project showcases, and various static project pages. The site is containerized with Docker and uses nginx as a reverse proxy.

## Development Commands

### Docker Operations
```bash
make up           # Start containers (detects environment: prod on hostname 'samuelclay', dev elsewhere)
make down         # Stop containers
make log          # Follow container logs
```

### Django Management
```bash
make migrate            # Run database migrations
make makemigrations     # Create new migrations
make showmigrations     # Show migration status
make createcachetable   # Create database cache table
```

### Direct Django Commands (if not using Docker)
```bash
python manage.py runserver    # Run development server
python manage.py migrate      # Apply migrations
```

### Accessing the Running Server
- **Development**: http://localhost:8882 (Django/gunicorn directly)
- **Production**: http://localhost (nginx on port 80, proxies to gunicorn on 8882)
- **HTTPS** (production only): https://localhost (nginx on port 443)

Note: Port 80 may be running a different service in development, always use port 8882 for local development.

## Architecture

### Application Structure

**Core Django Project**
- `settings.py` - Main Django configuration (Django 3.0, SQLite database, database caching)
- `urls.py` - URL routing for all pages and static projects
- `wsgi.py` - WSGI entry point for gunicorn

**Main App (`com/`)**
- `views.py` - Core view logic:
  - `index()` - Homepage with cached blog entries and random "is a..." quotes
  - `portfolio()` - Portfolio page renderer
  - `bikes()` - Boston bikes visualization page
  - `_fetch_and_parse_blog()` - Fetches RSS feed from ofbrooklyn.com
- Uses database caching (60 * 60 * 24 seconds) for blog entries
- Twitter and Flickr integrations are commented out but preserved in code

**Templates (`templates/`)**
- `base.html` - Base template with common structure
- `index.html` - Main homepage template
- Project-specific templates for each portfolio item (schedulerjones.html, caselife.html, etc.)

**Static Projects** (served via Django's static file serving)
- `portfolio/` - Portfolio images and assets
- `bikes/` - Boston bike crashes visualization (D3.js-based)
- `raphael/`, `schedulerjones/`, `caselife/`, `sunraylab/`, etc. - Individual project assets
- Each project has a dedicated URL route in `urls.py` that serves static files from its directory

**Syncr Module (`syncr/`)**
- Legacy integration code for various social services (Twitter, Picasa, Brightkite, Flickr, Delicious)
- Contains 59+ Python files with models and management commands
- Currently unused but preserved in codebase

### Deployment Architecture

**Docker Setup**
- `Dockerfile` - Python 3.12-slim based image with gunicorn
- `docker-compose.yml` - Three services:
  1. `web` - Django app running on gunicorn (port 8882)
  2. `nginx` - Reverse proxy (ports 80/443)
  3. `certbot` - SSL certificate management
- Environment-specific configs via `docker-compose.dev.yml` and `docker-compose.prod.yml`
- Makefile auto-detects environment based on hostname

**SSL/Certbot**
- Uses standalone mode (HTTP validation on port 80)
- Automated renewal via cron (daily at 3 AM)
- Scripts in `certbot/` directory:
  - `renew-certbot-standalone.sh` - Stops nginx, renews cert, restarts nginx
  - `setup-certbot-cron.sh` - Configures cron job
- See `CERTBOT_README.md` for full SSL renewal documentation

**Nginx Configuration**
- Config files in `config/nginx.prod/` and `config/nginx.dev/`
- Serves static files from `/static/` mapped to `media/` directory
- Proxies dynamic requests to gunicorn on port 8882

### Database

- SQLite database: `clay.db`
- Uses database-backed caching (table: `cache`)
- Minimal models in `com/models.py`
- Timezone: America/New_York

### Key Dependencies

```
django~=3.0
feedparser~=6.0         # RSS feed parsing
requests~=2.0           # HTTP requests
BeautifulSoup4~=4.0     # HTML parsing
gunicorn~=21.0          # WSGI server
django-tagging~=0.5.0   # Tagging support
```

## Important Patterns

### Caching Strategy
All external data (blog feeds) is cached for 24 hours using Django's database cache. Check cache before fetching:
```python
data = cache.get('key')
if not data:
    data = fetch_data()
    cache.set('key', data, 60 * 60 * 24)
```

### URL Patterns
Static project content is served via `django.views.static.serve` with document roots pointing to project directories. Pattern:
```python
re_path(r'^projectname/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT + '/../projectname'})
```

### Environment Detection
The Makefile uses hostname detection to choose prod vs dev compose files:
- Hostname `samuelclay` = production
- Any other hostname = development

## Project Context

This is a personal portfolio site showcasing various projects including:
- NewsBlur (RSS reader)
- Turn Touch (Bluetooth remote)
- Pulse & Bloom (Burning Man art installation)
- Boston Bikes Visualization
- Various other web projects and experiments

The site prioritizes simplicity and maintainability over complex features.
