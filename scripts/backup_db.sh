#!/usr/bin/env bash
# ==============================================================================
# JobPilot AI --- Automated Database Backup Script
# Usage: ./scripts/backup_db.sh
# Can be run manually or configured via cron:
# 0 2 * * * /home/user/jobpilot-ai/scripts/backup_db.sh >> /var/log/jobpilot_backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./storage/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/jobpilot_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Database parameters (defaults or from .env)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-jobpilot}"
DB_NAME="${POSTGRES_DB:-jobpilot}"
export PGPASSWORD="${POSTGRES_PASSWORD:-jobpilot_secret}"

echo "=========================================================="
echo "Starting JobPilot AI database backup: ${TIMESTAMP}"
echo "=========================================================="

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump and compress with gzip
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -F p | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✓ Backup created successfully: ${BACKUP_FILE} (Size: ${BACKUP_SIZE})"
else
    echo "✗ Backup failed!" >&2
    exit 1
fi

# Clean up backups older than RETENTION_DAYS
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "jobpilot_backup_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete
echo "✓ Old backup cleanup completed."

echo "=========================================================="
echo "Backup routine finished successfully."
echo "=========================================================="
