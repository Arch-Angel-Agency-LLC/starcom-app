import requests
import json
import os
import logging
import re
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# NOAA API BASE URL
NOAA_BASE_URL = "https://services.swpc.noaa.gov/json/"

# Primary Endpoints: Core Space Weather Data for Global Net Energy (GNE)
PRIMARY_ENDPOINTS = {
    "solar_radiation_xray": "goes/primary/xrays-1-day.json",
    "solar_radiation_xray_7d": "goes/primary/xrays-7-day.json",
    "xray_flares": "goes/primary/xray-flares-latest.json",
    "geomagnetic_dst": "geospace/geospace_dst_1_hour.json",
    "geomagnetic_kp": "geospace/geospace_pred_est_kp_1_hour.json",
    "solar_wind_swepam": "ace/swepam/ace_swepam_1h.json",
    "solar_protons": "goes/primary/integral-protons-1-day.json",
    "solar_electrons": "goes/primary/integral-electrons-1-day.json",
    "magnetometers": "goes/primary/magnetometers-1-day.json",
    "cosmic_rays_sis": "ace/sis/ace_sis_32s.json"
}

# Secondary Endpoints: Extended Space Weather Data
SECONDARY_ENDPOINTS = {
    "geomagnetic_dst_7d": "geospace/geospace_dst_7_day.json",
    "geomagnetic_kp_7d": ["geospace/geospce_pred_est_kp_7_day.json", "geospace/geosapce_pred_est_kp_7_day.json"],
    "solar_wind_density": "ace/swepam/ace_swepam_1h.json",
    "solar_wind_speed": "dscovr/dscovr_mag_1s.json",
    "total_electron_content": "geospace/geospace_pred_est_kp_1_hour.json",
    "plasma_pressure": "ace/swepam/ace_swepam_1h.json",
    "schumann_proxy": "goes/primary/magnetometers-7-day.json",
    "integral_proton_flux": "goes/primary/integral-proton-fluence-7-day.json",
    "integral_electron_flux": "goes/primary/integral-electron-fluence-7-day.json",
}

# Tertiary Endpoints: Alternative Perspectives (Electric Field & Differential Particle Flux)
TERTIARY_ENDPOINTS = {
    "electric_field_us_canada": "lists/rgeojson/US-Canada-1D/",
    "electric_field_interMag": "lists/rgeojson/InterMagEarthScope/",
    "differential_protons_1d": "goes/primary/differential-protons-1-day.json",
    "differential_protons_3d": "goes/primary/differential-protons-3-day.json",
    "differential_electrons_1d": "goes/primary/differential-electrons-1-day.json",
    "differential_electrons_3d": "goes/primary/differential-electrons-3-day.json",
    "ace_magnetic_field_1h": "ace/mag/ace_mag_1h.json",
    "ace_epam_5m": "ace/epam/ace_epam_5m.json",
}

# Directory to store data
DATA_DIR = "noaa_data"
os.makedirs(DATA_DIR, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_latest_file_url(base_url, directory_key):
    """
    Fetch the latest file URL from a directory listing.
    """
    directory_path = TERTIARY_ENDPOINTS[directory_key]
    
    # 1️⃣ Try fetching a directory index (if it exists)
    index_url = f"{base_url}{directory_path}index.json"
    try:
        response = requests.get(index_url, timeout=10)
        if response.status_code == 200:
            files = response.json().get("files", [])
            latest_file = max(files, key=lambda f: f['timestamp'])['filename']
            logging.info(f"✅ Found latest file from index: {latest_file}")
            return f"{base_url}{directory_path}{latest_file}"
    except Exception as e:
        logging.warning(f"⚠️ No index file available: {e}")

    # 2️⃣ Try fetching a "latest" alias (wildcard or predefined latest link)
    latest_url = f"{base_url}{directory_path}latest.json"
    try:
        response = requests.head(latest_url, timeout=5)
        if response.status_code == 200:
            logging.info(f"✅ Found latest file alias: {latest_url}")
            return latest_url
    except Exception as e:
        logging.warning(f"⚠️ No 'latest' alias found: {e}")

    # 3️⃣ If no index or alias, attempt to list files manually
    logging.info(f"🔍 Attempting manual filename discovery for {directory_key}...")
    list_url = f"{base_url}{directory_path}"
    try:
        response = requests.get(list_url, timeout=10)
        if response.status_code == 200:
            # Extract filenames using regex
            filenames = re.findall(r'(\d{8}T\d{6}-15-Efield-[\w.-]+\.json)', response.text)
            if filenames:
                latest_file = sorted(filenames, reverse=True)[0]  # Get the latest timestamped file
                logging.info(f"✅ Manually discovered latest file: {latest_file}")
                return f"{base_url}{directory_path}{latest_file}"
    except Exception as e:
        logging.error(f"⚠️ Unable to list files: {e}")

    logging.error(f"❌ No latest file found for {directory_key}.")
    return None

def fetch_noaa_data(data_endpoints, category):
    """
    Fetch NOAA data from specified endpoints and save as JSON files.
    """
    fetched_data = {}
    session = requests.Session()
    retry = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    for key, endpoint in data_endpoints.items():
        if isinstance(endpoint, list):
            for ep in endpoint:
                url = f"{NOAA_BASE_URL}{ep}"
                try:
                    response = session.get(url, timeout=10)
                    response.raise_for_status()
                    break
                except requests.exceptions.RequestException:
                    continue
            else:
                logging.error(f"❌ Error fetching {key}: All endpoint variations failed")
                continue
        elif endpoint.endswith('/'):
            url = get_latest_file_url(NOAA_BASE_URL, key)
            if not url:
                continue
        else:
            url = f"{NOAA_BASE_URL}{endpoint}"
        
        try:
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            fetched_data[key] = data

            # Save data to a local JSON file
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            file_path = os.path.join(DATA_DIR, f"{category}_{key}_{timestamp}.json")
            with open(file_path, "w") as f:
                json.dump(data, f, indent=4)
            
            logging.info(f"✅ Successfully fetched: {key} ({category})")
        
        except requests.exceptions.RequestException as e:
            logging.error(f"❌ Error fetching {key}: {e}")
    
    return fetched_data

def cleanup_old_files(data_dir, max_age_hours=24, max_files_per_category=10):
    """
    Clean up old NOAA data files to prevent unlimited accumulation
    - Remove files older than max_age_hours
    - Keep only max_files_per_category newest files per category
    """
    if not os.path.exists(data_dir):
        return
    
    cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
    files_by_category = {}
    files_to_delete = []
    
    # Categorize files and check age
    for filename in os.listdir(data_dir):
        if not filename.endswith('.json'):
            continue
            
        file_path = os.path.join(data_dir, filename)
        file_stat = os.stat(file_path)
        file_time = datetime.fromtimestamp(file_stat.st_mtime)
        
        # Extract category from filename (e.g., "primary_solar_wind_20250220..." -> "primary_solar_wind")
        parts = filename.split('_')
        if len(parts) >= 3:
            category = '_'.join(parts[:-1])  # Everything except timestamp
            
            if category not in files_by_category:
                files_by_category[category] = []
            files_by_category[category].append((filename, file_path, file_time))
        
        # Mark old files for deletion
        if file_time < cutoff_time:
            files_to_delete.append(file_path)
    
    # Keep only newest files per category
    for category, files in files_by_category.items():
        files.sort(key=lambda x: x[2], reverse=True)  # Sort by time, newest first
        if len(files) > max_files_per_category:
            for filename, file_path, file_time in files[max_files_per_category:]:
                if file_path not in files_to_delete:
                    files_to_delete.append(file_path)
    
    # Delete marked files
    deleted_count = 0
    for file_path in files_to_delete:
        try:
            os.remove(file_path)
            deleted_count += 1
        except OSError as e:
            logging.error(f"❌ Failed to delete {file_path}: {e}")
    
    if deleted_count > 0:
        logging.info(f"🧹 Cleaned up {deleted_count} old NOAA data files")

if __name__ == "__main__":
    # Clean up old files before fetching new data
    logging.info("\n🧹 Cleaning up old NOAA data files...")
    cleanup_old_files(DATA_DIR, max_age_hours=24, max_files_per_category=5)
    
    # Fetch Primary Space Weather Data
    logging.info("\n🌍 Fetching Primary Space Weather Data...")
    primary_data = fetch_noaa_data(PRIMARY_ENDPOINTS, "primary")

    # Fetch Secondary Space Weather Data
    logging.info("\n⚡ Fetching Secondary Space Weather Data...")
    secondary_data = fetch_noaa_data(SECONDARY_ENDPOINTS, "secondary")

    # Fetch Tertiary Space Weather Data
    logging.info("\n🔮 Fetching Tertiary (Alternative) Space Weather Data...")
    tertiary_data = fetch_noaa_data(TERTIARY_ENDPOINTS, "tertiary")