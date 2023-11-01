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

down:
	docker-compose $(COMPOSE_FILES) down

log:
	docker-compose $(COMPOSE_FILES) logs -f
