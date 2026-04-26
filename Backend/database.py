from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker

DATABASE_URL = "postgresql://localhost/internsync"

engine = create_engine(DATABASE_URL)
session_factory = sessionmaker(bind=engine)
db = scoped_session(session_factory)

Base = declarative_base()
Base.query = db.query_property()
