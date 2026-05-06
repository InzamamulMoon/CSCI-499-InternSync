from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import requests
import re
import time 
from bs4 import BeautifulSoup
from matcher import score_internships, get_sample_data, weighted_score, filter_by_score, top_matches, location_boost, explain_match, skill_gap, embedding_then_score
from database import db
from models import User, UserProfile, Application
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173'], supports_credentials=True)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/internsync'
db.init_app(app)
logging.basicConfig(level=logging.DEBUG)


summer_url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"
offseason_url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README-Off-Season.md"

_cache={
    "summer": {"data": None, "timestamp": 0},
    "offseason": {"data": None, "timestamp": 0}
}


CACHE_TTL = 900  # 15 minutes
 
def get_cached_internships(season="summer"):
    cache = _cache[season]
    if time.time() - cache["timestamp"] < CACHE_TTL and cache["data"]:
        return cache["data"]
    url = summer_url if season == "summer" else offseason_url
    season_name = "Summer" if season == "summer" else "Off-Season"
    data = fetch_and_parse_readme(url, season_name)
    cache["data"] = data
    cache["timestamp"] = time.time()
    return data



def fetch_and_parse_readme(url, season_name):
    response = requests.get(url, timeout=10)
    
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

@app.route("/refresh", methods=["POST"])
def refresh():
    _cache["timestamp"] = 0
    get_cached_internships()
    return jsonify({"message": "Cache refreshed"})

@app.route("/match", methods=["POST"])
def match():
    data = request.get_json()
    user_profile = data["user_profile"]
    preferred_location = data.get("preferred_location", None)
    min_score = data.get("min_score", 0.0)

    all_categories = get_cached_internships("summer")
    flattened = []
    for rows in all_categories.values():
        flattened.extend(rows)
 
    if not flattened:
        return jsonify({"error": "No internships found"}), 502

    results = embedding_then_score(user_profile, flattened, top_k=100)
    if preferred_location:
        results = location_boost(results, preferred_location)
    results = filter_by_score(results, min_score)
    results = top_matches(results, 20)
    for internship in results:
        raw_explanation = explain_match(user_profile, internship)
        internship["explanation"] = {
            "suggestion": raw_explanation.get("suggestion", ""),
            "matched_skills": (
                raw_explanation.get("matched_languages", [])
                + raw_explanation.get("matched_courses", [])
                + raw_explanation.get("matched_interests", [])
            ),
        }
        internship["skill_gap"] = skill_gap(user_profile, internship)
    return jsonify(results)


@app.route("/skill-gap", methods=["POST"])
def skill_gap_endpoint():
    data = request.get_json()
    user_profile = data["user_profile"]
    internship = data["internship"]
    return jsonify(skill_gap(user_profile, internship))


@app.route("/score-breakdown", methods=["POST"])
def score_breakdown():
    data = request.get_json()
    user_profile = data["user_profile"]
    internship = data["internship"]
    return jsonify({
        "explanation": explain_match(user_profile, internship),
        "weighted_score": weighted_score(user_profile, internship),
        "internship": internship
    })

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    user = User(email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401
    return jsonify({"message": "Login successful", "user_id": user.id})


@app.route("/profile/save", methods=["POST"])
def profile_save():
    data = request.get_json()
    user_id = data.get("user_id")
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if profile:
        profile.languages = json.dumps(data.get("languages", []))
        profile.courses = json.dumps(data.get("courses", []))
        profile.interests = json.dumps(data.get("interests", []))
        profile.unique_background = data.get("unique_background")
    else:
        profile = UserProfile(
            user_id=user_id,
            languages=json.dumps(data.get("languages", [])),
            courses=json.dumps(data.get("courses", [])),
            interests=json.dumps(data.get("interests", [])),
            unique_background=data.get("unique_background"),
        )
        db.session.add(profile)
    db.session.commit()
    return jsonify({"message": "Profile saved successfully"})


@app.route("/profile/load", methods=["GET"])
def profile_load():
    user_id = request.args.get("user_id")
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify({
        "user_id": profile.user_id,
        "languages": json.loads(profile.languages) if profile.languages else [],
        "courses": json.loads(profile.courses) if profile.courses else [],
        "interests": json.loads(profile.interests) if profile.interests else [],
        "unique_background": profile.unique_background,
    })


@app.route("/applications/save", methods=["POST"])
def applications_save():
    data = request.get_json()
    application = Application(
        user_id=data.get("user_id"),
        company=data.get("company"),
        role=data.get("role"),
        location=data.get("location"),
        status=data.get("status", "To Apply"),
    )
    db.session.add(application)
    db.session.commit()
    return jsonify({"message": "Application saved successfully", "id": application.id})


@app.route("/applications/load", methods=["GET"])
def applications_load():
    user_id = request.args.get("user_id")
    applications = Application.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": a.id,
            "company": a.company,
            "role": a.role,
            "location": a.location,
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
        }
        for a in applications
    ])


if __name__ == '__main__':
    app.run(debug=True)
