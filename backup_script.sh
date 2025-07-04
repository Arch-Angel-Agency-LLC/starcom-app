#!/bin/zsh
# Backup script for Starcom App

# Set variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="starcom-app_backup_${TIMESTAMP}"
DESTINATION="/Volumes/dataDrive_4TB/LS220D8F9"
SOURCE_DIR="/Users/jono/Documents/GitHub/starcom-app"
BACKUP_FILE="${BACKUP_NAME}.zip"
LOG_FILE="${BACKUP_NAME}_log.txt"

# Create log file
echo "Starting backup of Starcom App at $(date)" > ${SOURCE_DIR}/${LOG_FILE}
echo "Source: ${SOURCE_DIR}" >> ${SOURCE_DIR}/${LOG_FILE}
echo "Destination: ${DESTINATION}/${BACKUP_FILE}" >> ${SOURCE_DIR}/${LOG_FILE}

# Check if destination is mounted
if [ ! -d "$DESTINATION" ]; then
  echo "ERROR: Destination drive not mounted at $DESTINATION" >> ${SOURCE_DIR}/${LOG_FILE}
  echo "ERROR: Destination drive not mounted at $DESTINATION"
  echo "Attempting local backup to ~/Downloads"
  DESTINATION="$HOME/Downloads"
  echo "New destination: $DESTINATION" >> ${SOURCE_DIR}/${LOG_FILE}
fi

# Create zip file
echo "Creating zip file..." >> ${SOURCE_DIR}/${LOG_FILE}
cd "$(dirname "$SOURCE_DIR")"
zip -r "${DESTINATION}/${BACKUP_FILE}" "$(basename "$SOURCE_DIR")" -x "*/node_modules/*" "*/target/*" "*/dist/*" "*/.git/*" >> ${SOURCE_DIR}/${LOG_FILE} 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully at $(date)" >> ${SOURCE_DIR}/${LOG_FILE}
  echo "Backup file: ${DESTINATION}/${BACKUP_FILE}" >> ${SOURCE_DIR}/${LOG_FILE}
  echo "Backup size: $(du -h "${DESTINATION}/${BACKUP_FILE}" | cut -f1)" >> ${SOURCE_DIR}/${LOG_FILE}
  
  # Copy log and README to destination
  cp ${SOURCE_DIR}/${LOG_FILE} ${DESTINATION}/
  cp ${SOURCE_DIR}/BACKUP-README.md ${DESTINATION}/${BACKUP_NAME}_README.md
  
  echo "Backup completed successfully."
  echo "Backup file: ${DESTINATION}/${BACKUP_FILE}"
else
  echo "ERROR: Backup failed at $(date)" >> ${SOURCE_DIR}/${LOG_FILE}
  echo "ERROR: Backup failed. Check log file: ${SOURCE_DIR}/${LOG_FILE}"
fi

# Copy log to project directory for reference
cp ${SOURCE_DIR}/${LOG_FILE} ${SOURCE_DIR}/backup_logs/
mkdir -p ${SOURCE_DIR}/backup_logs

echo "Backup process completed."
