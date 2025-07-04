#!/bin/bash
# Verify the backup zip file

LOG_FILE="backup_verify_log.txt"
DESTINATION="/Volumes/dataDrive_4TB/LS220D8F9"

# Check if the network drive is mounted
if [ ! -d "$DESTINATION" ]; then
  DESTINATION="$HOME/Downloads"
fi

echo "Verifying backup at $(date)" > "${LOG_FILE}"

# Find the most recent starcom backup in the destination
BACKUP_FILE=$(find "${DESTINATION}" -name "starcom-app_backup_*.zip" -type f -print0 | xargs -0 ls -t | head -1)

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: No backup file found in ${DESTINATION}" >> "${LOG_FILE}"
  echo "ERROR: No backup file found in ${DESTINATION}"
  exit 1
fi

echo "Found backup: ${BACKUP_FILE}" >> "${LOG_FILE}"
echo "Found backup: ${BACKUP_FILE}"

echo "Found backup: ${BACKUP_FILE}"

# Get backup file size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "Backup size: ${BACKUP_SIZE}" >> "${LOG_FILE}"

# Test the zip file integrity
echo "Testing zip file integrity..." >> "${LOG_FILE}"
unzip -t "${BACKUP_FILE}" >> "${LOG_FILE}" 2>&1

if [ $? -eq 0 ]; then
  echo "Verification successful. Backup is valid." >> "${LOG_FILE}"
  echo "Verification successful. Backup is valid and located at: ${BACKUP_FILE}"
else
  echo "ERROR: Verification failed. Backup may be corrupted." >> "${LOG_FILE}"
  echo "ERROR: Verification failed. Backup may be corrupted."
fi

# Copy log to project directory
mkdir -p "/Users/jono/Documents/GitHub/starcom-app/backup_logs"
cp "${LOG_FILE}" "/Users/jono/Documents/GitHub/starcom-app/backup_logs/"

echo "Verification process completed."
