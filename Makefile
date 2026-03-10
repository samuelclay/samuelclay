# Detect the environment
HOSTNAME := $(shell hostname)

ifeq ($(HOSTNAME),samuelclay)
    COMPOSE_FILES=-f docker-compose.yml -f docker-compose.prod.yml
else
    COMPOSE_FILES=-f docker-compose.yml -f docker-compose.dev.yml
endif

.PHONY: up down

# By default, the 'up' target will be executed
default: up

up:
	docker-compose $(COMPOSE_FILES) up -d

dev:
	docker-compose $(COMPOSE_FILES) up -d
	@echo ""
	@echo "\033[1;36m  ╔══════════════════════════════════════╗\033[0m"
	@echo "\033[1;36m  ║                                      ║\033[0m"
	@echo "\033[1;36m  ║\033[0m   \033[1;33m⚡ samuelclay.com dev server\033[0m       \033[1;36m║\033[0m"
	@echo "\033[1;36m  ║\033[0m                                      \033[1;36m║\033[0m"
	@echo "\033[1;36m  ║\033[0m   \033[1;32m→ http://localhost:8882\033[0m             \033[1;36m║\033[0m"
	@echo "\033[1;36m  ║\033[0m                                      \033[1;36m║\033[0m"
	@echo "\033[1;36m  ╚══════════════════════════════════════╝\033[0m"
	@echo ""
	docker-compose $(COMPOSE_FILES) logs -f -n0

down:
	docker-compose $(COMPOSE_FILES) down

log:
	docker-compose $(COMPOSE_FILES) logs -f

migrate:
	docker-compose $(COMPOSE_FILES) exec web python manage.py migrate
makemigrations:
	docker-compose $(COMPOSE_FILES) exec web python manage.py makemigrations
showmigrations:
	docker-compose $(COMPOSE_FILES) exec web python manage.py showmigrations
createcachetable:
	docker-compose $(COMPOSE_FILES) exec web python manage.py createcachetable

ssh:
ifdef RUN
	@ssh -l sclay -i /srv/secrets-newsblur/keys/newsblur.key 157.230.10.91 "$(RUN)"
else
	@ssh -l sclay -i /srv/secrets-newsblur/keys/newsblur.key 157.230.10.91
endif
