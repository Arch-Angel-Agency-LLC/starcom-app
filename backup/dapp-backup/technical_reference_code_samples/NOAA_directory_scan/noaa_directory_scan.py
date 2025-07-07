import requests
from bs4 import BeautifulSoup
import os
import itertools
import sys
import time
import threading

# Base URL to start scanning
BASE_URL = "https://services.swpc.noaa.gov/json/"

def fetch_directory_structure(url, base_path="", progress=None):
    """
    Recursively fetches the directory structure from the given URL.
    
    Args:
        url (str): The URL to scan.
        base_path (str): The base path for the current directory level.
        progress (dict): Dictionary to track progress.
    
    Returns:
        list: A list of paths representing the directory structure.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    structure = []

    for link in soup.find_all('a'):
        href = link.get('href')
        if href and href not in ['../', '/']:
            if href.endswith('/'):
                # It's a directory, recursively fetch its structure
                structure.extend(fetch_directory_structure(url + href, os.path.join(base_path, href), progress))
            elif href.endswith('.json'):
                # It's a JSON file, add to the structure list
                file_path = os.path.join(base_path, href)
                structure.append(file_path)
                if progress:
                    progress['files'] += 1
    
    return structure

def save_structure_to_file(structure, filename="noaa_directory_structure.txt"):
    """
    Saves the directory structure to a file.
    
    Args:
        structure (list): The directory structure to save.
        filename (str): The name of the file to save the structure to.
    """
    try:
        with open(filename, 'w') as f:
            for item in structure:
                f.write(f"{item}\n")
        print(f"Directory structure saved to {filename}")
    except IOError as e:
        print(f"Error writing to file {filename}: {e}")

def spinner(progress):
    """
    Displays a spinner animation and progress count in the terminal.
    
    Args:
        progress (dict): Dictionary to track progress.
    """
    spinner_cycle = itertools.cycle(['|', '/', '-', '\\'])
    while not progress['done']:
        sys.stdout.write(f"\r{next(spinner_cycle)} Folders: {progress['folders']} Files: {progress['files']}")
        sys.stdout.flush()
        time.sleep(0.1)
    sys.stdout.write(f"\rDone! Folders: {progress['folders']} Files: {progress['files']}\n")

if __name__ == "__main__":
    progress = {'folders': 0, 'files': 0, 'done': False}
    spinner_thread = threading.Thread(target=spinner, args=(progress,))
    spinner_thread.start()

    # Fetch the directory structure starting from the base URL
    directory_structure = fetch_directory_structure(BASE_URL, progress=progress)
    progress['done'] = True
    spinner_thread.join()

    if directory_structure:
        # Save the fetched structure to a file
        save_structure_to_file(directory_structure)
    else:
        print("No directory structure to save.")
