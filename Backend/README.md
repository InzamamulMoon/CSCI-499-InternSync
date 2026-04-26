# InternSync Matching Algorithm

This module matches students to internships using NLP and keyword analysis. It extracts keywords from a student's profile (languages, courses, and interests) and compares them against internship listings to produce ranked, explainable match scores.

## Functions

| Function | Description |
|---|---|
| `normalize_text(text)` | Lowercases text, removes punctuation, and filters stop words. Returns a list of tokens. |
| `extract_keywords(user_profile)` | Combines a user's languages, courses, and interests into a single normalized keyword list. |
| `match_keywords(user_keywords, internship)` | Counts how many user keywords appear in a given internship's role and company text. |
| `score_internships(user_profile, internships)` | Scores and sorts a list of internships based on keyword overlap with the user profile. |
| `weighted_score(user_profile, internship)` | Scores an internship using category weights (languages 3x, courses 2x, interests 1x) as a percentage. |
| `explain_match(user_profile, internship)` | Returns matched languages, courses, and interests, plus a human-readable suggestion string. |
| `skill_gap(user_profile, internship)` | Returns keywords in the internship that are missing from the user profile and a gap percentage. |
| `tfidf_score(user_profile, internships)` | Scores internships using TF-IDF vectorization and cosine similarity against the user profile. |
| `filter_by_score(scored_internships, min_score)` | Filters out internships below a minimum score threshold. |
| `top_matches(scored_internships, n)` | Returns the top n internships sorted by score from highest to lowest. |
| `location_boost(scored_internships, preferred_location)` | Adds a 10-point boost (capped at 100) to internships matching the user's preferred location. |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/match` | POST | Scores and ranks sample internships against a user profile, with optional location boost, score filter, and top-n limit. |
| `/skill-gap` | POST | Returns the missing skills and gap percentage between a user profile and a single internship. |
| `/score-breakdown` | POST | Returns the weighted score and match explanation for a user profile against a single internship. |

## How Scoring Works

Keyword-based scoring uses weighted categories to reflect how relevant each part of a student's profile is to an internship:

- **Languages** are weighted **3x** — programming languages are the strongest signal for technical roles.
- **Courses** are weighted **2x** — relevant coursework demonstrates domain knowledge.
- **Interests** are weighted **1x** — interests provide softer contextual signal.

The weighted score is calculated as the sum of matched keywords multiplied by their category weight, divided by the maximum possible weighted score, expressed as a percentage.

For more advanced matching, **TF-IDF cosine similarity** is also available via `tfidf_score`. This method vectorizes the user profile and each internship as text documents and measures the angle between them in vector space, capturing term importance relative to the full set of internships rather than relying on exact keyword overlap.

## Database Architecture

The database uses PostgreSQL with SQLAlchemy ORM for persistent storage of users, profiles, and application tracking.

### Tables

| Table | Description |
|---|---|
| `User` | Stores each user's email address and hashed password. |
| `UserProfile` | Stores a user's languages, courses, interests, and unique background, linked to a User. |
| `Application` | Stores Kanban-style application states (To Apply, Applied, Interviewing, Offer, Rejected) linked to a User. |

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/register` | POST | Creates a new user account with a hashed password. |
| `/login` | POST | Validates credentials and returns a success response with the user ID. |
| `/profile/save` | POST | Creates or updates the profile for a given user. |
| `/profile/load` | GET | Returns the saved profile for a given user. |
| `/applications/save` | POST | Creates a new application record for a given user. |
| `/applications/load` | GET | Returns all application records for a given user. |

### Setup

1. Install dependencies:
   ```
   pip3 install -r requirements.txt
   ```
2. Create the PostgreSQL database:
   ```
   createdb internsync
   ```
3. Initialize tables:
   ```
   python3 init_db.py
   ```
