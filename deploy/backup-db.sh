#!/usr/bin/env bash
# Cron this (e.g. `0 3 * * * /srv/my-blog/current/deploy/backup-db.sh`).
# Uses sqlite3's .backup, not `cp`, so a WAL-mode write in progress can't produce
# a torn/inconsistent snapshot. Keeps the last 14 daily backups.
set -euo pipefail

DB_PATH="/var/lib/my-blog/data/local.db"
BACKUP_DIR="/var/lib/my-blog/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/local-$TIMESTAMP.db'"

find "$BACKUP_DIR" -name 'local-*.db' -type f -printf '%T@ %p\n' \
	| sort -rn | tail -n +15 | cut -d' ' -f2- | xargs -r rm --
