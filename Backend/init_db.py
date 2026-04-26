from database import engine, Base
from models import User, UserProfile, Application

Base.metadata.create_all(engine)
print("Database tables created successfully")
