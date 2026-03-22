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

    # Find all category sections
    category_pattern = r'##\s*[^\n]*Internship Roles'
    category_headers = re.finditer(category_pattern, content)
    
    all_categories = {}
    
    for match in category_headers:
        header = match.group()
        print(f"\nFound category header: {header}")
        
        # Extract category name (remove emoji and "## ")
        category_name = re.sub(r'##\s*[^\w\s]*\s*', '', header)
        category_name = category_name.replace(' Internship Roles', '').strip()
        print(f"Category name: {category_name}")
        
        start_pos = match.end()
        
        # Find the next header or end marker
        next_header = re.search(r'##\s|🔒|\*\*\[See', content[start_pos:])
        if next_header:
            end_pos = start_pos + next_header.start()
        else:
            end_pos = len(content)
        
        section = content[start_pos:end_pos]
        
        soup = BeautifulSoup(section, 'html.parser')
        
        tbody = soup.find('tbody')
        if not tbody:
            print(f"No table found in {category_name}")
            continue
        
        rows = tbody.find_all('tr')
        print(f"Found {len(rows)} rows in {category_name}")

         # Get all rows
        rows = tbody.find_all('tr')
        print(f"Found {len(rows)} rows in {category_name}")
        
        # Format the data
        internships = []
        for row in rows:

            cells = row.find_all('td')
            
            cell_data = [cell.get_text(strip=True) for cell in cells]
            
            # Handle the 5 columns
            if len(cell_data) == 5:
                company = cell_data[0]
                role = cell_data[1]
                location = cell_data[2]
                age = cell_data[4]
           
            else:
                continue
            
            # Handle the arrow case (↳)
            if company == "↳" and len(internships) > 0:
                company = internships[-1]['company']


                    # Clean up company name - remove extra spaces
            company = re.sub(r'\s+', ' ', company).strip()
            
            # Extract application links from the application cell
            # Find all <a> tags in the application cell
            app_cell = cells[3]  # Get the actual cell element
            links = []
            for link in app_cell.find_all('a', href=True):
                href = link['href']
                # Filter out image links
                if not any(x in href for x in ['.png', '.jpg', '.gif', 'imgur.com', 'cloudinary']):
                    links.append(href)
            
            internships.append({
                'company': company,
                'role': role,
                'location': location,
                'application_links': links,
                'age': age
            })
        
        if len(internships) > 0:
            all_categories[category_name] = internships
    
    print(f"Total categories found: {len(all_categories)}")
    total_internships = sum(len(v) for v in all_categories.values())
    print(f"Total internships: {total_internships}")
    
    return all_categories


@app.route('/')
def hello():
    summer_data = fetch_and_parse_readme(summer_url, "Summer")
    
    
    result = {
        'summer_2026': summer_data,   
    }
    
    total = 0
    for v in summer_data.values():  
     total += len(v)  
    
    print(f"Summer internships: {total}")
    
    if total == 0:
        return jsonify({"error": "No internships found"}), 500
    
    result['summary'] = {
        'total_count': total
    }
    
    return jsonify(result)