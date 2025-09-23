.PHONY: up down build logs backend-shell migrate test

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f --tail=200

backend-shell:
	docker compose exec backend bash

migrate:
	docker compose exec backend python manage.py migrate --noinput

test:
	docker compose exec backend pytest -q
