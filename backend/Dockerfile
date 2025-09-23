# syntax=docker/dockerfile:1.7

FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Poetry
ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false
RUN curl -sSL https://install.python-poetry.org | python - --version $POETRY_VERSION
ENV PATH="/root/.local/bin:${PATH}"

# Install dependencies
COPY pyproject.toml /app/
RUN poetry install --no-root --only main

# Copy app code
COPY . /app/

# Prepare entrypoint
RUN chmod +x /app/entrypoint.sh

EXPOSE 8003

ENV DJANGO_SETTINGS_MODULE=config.settings \
    DJANGO_USE_FORCE_SCRIPT_NAME=true \
    DJANGO_FORCE_SCRIPT_NAME=/casapp

CMD ["/app/entrypoint.sh", "gunicorn", "config.wsgi:application", "-c", "/app/gunicorn.conf.py"]
