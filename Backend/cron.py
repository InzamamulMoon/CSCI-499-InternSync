from app import app, fetch_and_parse_readme
from database import db
from models import Internship
from scraper import enrich_with_description  
from datetime import datetime, timezone
import json

summer_url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"
offseason_url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README-Off-Season.md"

def sync_internships(season):
    url = summer_url if season == "summer" else offseason_url
    season_name = "Summer" if season == "summer" else "Off-Season"
    all_categories = fetch_and_parse_readme(url, season_name)

    with app.app_context():
        Internship.query.filter_by(season=season).delete()

        for rows in all_categories.values():
            enriched = enrich_with_description(rows)  
            for row in enriched:
                db.session.add(Internship(
                    company=row["company"],
                    role=row["role"],
                    location=row["location"],
                    terms=row["terms"],
                    application_links=json.dumps(row["application_links"]),
                    age=row["age"],
                    description=row.get("description", ""), 
                    season=season,
                    last_updated=datetime.now(timezone.utc)
                ))
        db.session.commit()
        print(f"Synced {season} internships to database successfully")

if __name__ == "__main__":
    sync_internships("summer")
    sync_internships("offseason")