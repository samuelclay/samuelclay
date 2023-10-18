.PHONY: run

run:
	docker-compose up --build -d nginx web certbot

down:
	docker-compose down -d nginx web certbot
