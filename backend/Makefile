POETRY?=poetry

.PHONY: install test lint run migrate superuser

install:
	$(POETRY) install

migrate:
	$(POETRY) run python manage.py migrate

superuser:
	$(POETRY) run python manage.py createsuperuser

run:
	DJANGO_USE_FORCE_SCRIPT_NAME=true DJANGO_FORCE_SCRIPT_NAME=/casapp $(POETRY) run python manage.py runserver 0.0.0.0:8003

lint:
	$(POETRY) run ruff check . && $(POETRY) run black --check .

format:
	$(POETRY) run black .

test:
	$(POETRY) run pytest -q
