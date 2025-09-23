#!/usr/bin/env bash
set -euo pipefail

# Wait for Postgres
if [ -n "${DATABASE_URL:-}" ]; then
  echo "Waiting for database..."
  python - <<'PY'
import os, time
import urllib.parse as ul
import socket
url = os.environ['DATABASE_URL']
u = ul.urlparse(url)
host, port = u.hostname, u.port or 5432
for i in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            print('DB reachable')
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit('Database not reachable')
PY
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput --verbosity 0

exec "$@"
