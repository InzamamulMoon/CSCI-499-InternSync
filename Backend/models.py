from datetime import datetime
from database import db
import json

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile = db.relationship("UserProfile", back_populates="user", uselist=False)
    applications = db.relationship("Application", back_populates="user")

class UserProfile(db.Model):
    __tablename__ = "user_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    languages = db.Column(db.Text)
    courses = db.Column(db.Text)
    interests = db.Column(db.Text)
    unique_background = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", back_populates="profile")

class Application(db.Model):
    __tablename__ = "applications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    company = db.Column(db.String)
    role = db.Column(db.String)
    location = db.Column(db.String)
    status = db.Column(db.String, default="To Apply")
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", back_populates="applications")

class Internship(db.Model):
    __tablename__ = "internships"
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)
    location = db.Column(db.String)
    terms = db.Column(db.String)
    application_links = db.Column(db.Text)
    age = db.Column(db.String)
    season = db.Column(db.String)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "company": self.company,
            "role": self.role,
            "location": self.location,
            "terms": self.terms,
            "application_links": json.loads(self.application_links) if self.application_links else [],
            "age": self.age
        }