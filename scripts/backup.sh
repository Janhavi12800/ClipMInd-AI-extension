#!/usr/bin/env bash
# TechShield AI — Database Backup Script
# Usage: ./scripts/backup.sh [output_dir]
# Cron: 0 2 * * * /opt/techshield/scripts/backup.sh /backups

set -euo pipefail

OUTPUT_DIR="${1:-/backups/techshield}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/techshield_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

mkdir -p "$OUTPUT_DIR"

echo "[$(date)] Starting backup..."

if [ -n "${SUPABASE_DB_URL:-}" ]; then
  pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"
elif command -v supabase &>/dev/null; then
  supabase db dump --linked | gzip > "$BACKUP_FILE"
else
  echo "ERROR: Set SUPABASE_DB_URL or install Supabase CLI"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup complete: $BACKUP_FILE ($SIZE)"

# Upload to S3 if configured
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_S3_BUCKET}/db/$(basename "$BACKUP_FILE")"
  echo "[$(date)] Uploaded to s3://${BACKUP_S3_BUCKET}"
fi

# Prune old backups
find "$OUTPUT_DIR" -name "techshield_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] Pruned backups older than ${RETENTION_DAYS} days"
