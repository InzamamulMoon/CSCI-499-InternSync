# Replace entire init_db.py with this
from app import app
from database import db
from models import User, UserProfile, Application, Internship

with app.app_context():
    db.create_all()
    print("Database tables created successfully")