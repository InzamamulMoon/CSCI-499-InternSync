from flask import Flask, jsonify
import logging
import requests
import re
from bs4 import BeautifulSoup

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

summer_url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"
offseason_url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README-Off-Season.md"

def fetch_and_parse_readme(url, season_name):
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"Error: Could not fetch {season_name} README (status {response.status_code})")
        return {}
    
    # Decode README
    content = response.text
    print(f"Total content length: {len(content)}")

    # Find all category sections
    category_pattern = r'##\s*[^\n]*Internship Roles'
    category_headers = re.finditer(category_pattern, content)
    
    category_list = list(category_headers)
    print(f"Found {len(category_list)} category headers")
    
    all_categories = {}
    
    for match in category_list:
        header = match.group()
        print(f"\nFound category header: {header}")
        
        # Extract category name (remove emoji and "## ")
        category_name = re.sub(r'##\s*[^\w\s]*\s*', '', header)
        category_name = category_name.replace(' Internship Roles', '').strip()
        print(f"Category name: {category_name}")
        
        start_pos = match.end()
        
        # Find the next header or end marker
        next_header = re.search(r'\n##\s+[^\n]*Internship Roles', content[start_pos:])
        if next_header:
            end_pos = start_pos + next_header.start()
        else:
            end_pos = len(content)
        
        section = content[start_pos:end_pos]
        
        soup = BeautifulSoup(section, 'html.parser')
        # Find ALL tbody elements
        tbodies = soup.find_all('tbody')
        if not tbodies:
         print(f"No table found in {category_name}")
         continue

        # Collect rows from ALL tables
        all_rows = []
        for tbody in tbodies:
           rows = tbody.find_all('tr')
           all_rows.extend(rows)  # Add rows from this table

        rows = all_rows  # Now rows contains ALL rows from ALL tables
        print(f"Found {len(rows)} rows in {category_name}")
        
        # Format the data
        internships = []
        for row in rows:

            cells = row.find_all('td')
            
            cell_data = [cell.get_text(strip=True) for cell in cells]
            
            # Handle the 5 columns
            if len(cell_data) == 5:
                # Summer format: Company | Role | Location | Application | Age
                company = cell_data[0]
                role = cell_data[1]
                location = cell_data[2]
                age = cell_data[4]
                terms = "Summer 2026"
            elif len(cell_data) == 6:
                # Off-season format: Company | Role | Location | Terms | Application | Age
                company = cell_data[0]
                role = cell_data[1]
                location = cell_data[2]
                terms = cell_data[3]
                age = cell_data[5]
            else:
                # Skip invalid rows
                continue

            
            # Handle the arrow case (↳)
            if company == "↳" and len(internships) > 0:
                company = internships[-1]['company']


                    # Clean up company name - remove extra spaces
            company = re.sub(r'\s+', ' ', company).strip()
            
            # Extract application links from the application cell
            # Find all <a> tags in the application cell
            if len(cells)== 6:
               app_cell = cells[4]
            else:
                app_cell = cells[3]
                   
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
                'terms': terms,
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
    offseason_data = fetch_and_parse_readme(offseason_url, "Off-Season")
    
    result = {
        'summer_2026': summer_data,
        'off_season': offseason_data
    }
    
    summer_total = sum(len(v) for v in summer_data.values())
    offseason_total = sum(len(v) for v in offseason_data.values())
    total = summer_total + offseason_total
    
    if total == 0:
        return jsonify({"error": "No internships found"}), 500
    
    result['summary'] = {
        'summer_count': summer_total,
        'offseason_count': offseason_total,
        'total_count': total
    }
    
    return jsonify(result)

@app.route('/summer')
def summer_only():
    """Endpoint for summer internships only"""
    summer_data = fetch_and_parse_readme(summer_url, "Summer 2026")
    total = sum(len(v) for v in summer_data.values())
    
    if total == 0:
        return jsonify({"error": "No internships found"}), 500
    
    return jsonify(summer_data)
 
 
@app.route('/offseason')
def offseason_only():
    """Endpoint for off-season internships only"""
    offseason_data = fetch_and_parse_readme(offseason_url, "Off-Season")
    total = sum(len(v) for v in offseason_data.values())
    
    if total == 0:
        return jsonify({"error": "No internships found"}), 500
    
    return jsonify(offseason_data)

if __name__ == '__main__':
    app.run(debug=True)