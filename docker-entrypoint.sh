#!/bin/sh
set -e

# Ensure data directories exist (DB and uploads)
mkdir -p /data /uploads

# If public/uploads does not exist or is not a symlink, create a symlink to /data/uploads
for target in /app/public/uploads /app/uploads; do
  if [ ! -L "$target" ]; then
    rm -rf "$target" 2>/dev/null || true
    ln -s /uploads "$target"
  fi
done

# Move to app workdir
cd /app

# Run Prisma migrations (generate is already done at build time by next)
# Note: we run as non-root; prisma will write to /data/dev.db which is mounted
# Try running migrations; if none, push schema
if ! npx prisma migrate deploy; then
  echo "migrate deploy failed; attempting prisma db push"
  npx prisma db push || true
fi

exec "$@"
