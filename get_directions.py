import sys
import urllib.parse
import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv('GOOGLE_API_KEY')

def extract_coords_or_places(url):
    parsed = urllib.parse.urlparse(url)
    query = urllib.parse.parse_qs(parsed.query)
    path = parsed.path

    # Attempt to parse origin and destination from the URL
    try:
        parts = path.split("/dir/")[1].split("/")
        origin = urllib.parse.unquote(parts[0])
        destination = urllib.parse.unquote(parts[1])
        return origin, destination
    except (IndexError, ValueError):
        print("Could not extract origin/destination from URL.")
        sys.exit(1)

def get_directions(origin, destination, filename, mode="bicycling"):
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "key": API_KEY
    }

    res = requests.get(url, params=params)
    if res.status_code == 200:
        with open(filename, 'w') as f:
            json.dump(res.json(), f, indent=2)
        print(f"Saved directions to {filename}")
    else:
        print(f"Request failed with status code {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python get_directions.py <google_maps_url> <output_file.json>")
        sys.exit(1)

    url = sys.argv[1]
    filename = sys.argv[2]
    origin, destination = extract_coords_or_places(url)
    get_directions(origin, destination, filename)
