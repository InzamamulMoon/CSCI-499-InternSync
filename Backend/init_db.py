from app import app
from database import db
from models import User, UserProfile, Application, Internship
from werkzeug.security import generate_password_hash

DEMO_EMAIL = "internsync.demo@local"
DEMO_PASSWORD = "demo-internsync-local"

with app.app_context():
    db.create_all()
    print("Database tables created successfully")

    demo = User.query.filter_by(email=DEMO_EMAIL).first()
    if not demo:
        demo = User(
            email=DEMO_EMAIL,
            password_hash=generate_password_hash(DEMO_PASSWORD),
        )
        db.session.add(demo)
        db.session.commit()
        print(f"Demo user created (id={demo.id}, email={DEMO_EMAIL})")
    else:
        print(f"Demo user already exists (id={demo.id})")

    if not UserProfile.query.filter_by(user_id=demo.id).first():
        db.session.add(
            UserProfile(
                user_id=demo.id,
                languages="[]",
                courses="[]",
                interests="[]",
                unique_background="",
            )
        )
        db.session.commit()
        print("Empty demo profile created")
