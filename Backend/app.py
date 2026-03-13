from flask import Flask, jsonify
import logging
import base64
import requests
import re
from bs4 import BeautifulSoup

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

summer_url = "https://api.github.com/repos/SimplifyJobs/Summer2026-Internships/readme"


def fetch_and_parse_readme(url, season_name):
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"Error: Could not fetch {season_name} README (status {response.status_code})")
        return {}
    
    # Decode README
    data = response.json()

     
    if "content" in data and data["content"]:

        content_base64 = data["content"]
        print(f"Using base64 content field")

        # Remove newlines from base64 (GitHub adds them for readability)
        content_base64 = content_base64.replace('\n', '').replace('\r', '')
        content = base64.b64decode(content_base64).decode("utf-8")

    elif "download_url" in data and data["download_url"]:

        print(f"Content field empty, using download_url instead")

        download_url = data["download_url"]
        download_response = requests.get(download_url)
        content = download_response.text

    else:
        print(f"ERROR: No content or download_url available!")
        return {}
    
    print(f"Total content length: {len(content)}")