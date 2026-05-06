from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import db, Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    applications = relationship("Application", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    languages = Column(Text)
    courses = Column(Text)
    interests = Column(Text)
    unique_background = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String)
    role = Column(String)
    location = Column(String)
    status = Column(String, default="To Apply")
    applied_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="applications")

class Internship(db.Model):
    __tablename__ = "internships"
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)
    location = db.Column(db.String)
    terms = db.Column(db.String)
    application_links = db.Column(db.Text)  # stored as JSON string
    age = db.Column(db.String)
    season = db.Column(db.String)  # "summer" or "offseason"
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