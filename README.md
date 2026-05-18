# InternSync

InternSync matches students to internship listings from a database using their profile (languages, courses, interests) and lets them track applications on a Kanban board.

## Run locally

**Needs:** Node.js, Python 3.10+, PostgreSQL.

**Database**
```bash
createdb internsync
```

**Backend** (terminal 1)
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_db.py
python cron.py
python app.py
```

**Frontend** (terminal 2)
```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173/signin — sign in (any password), save a profile with at least one tag, then open Matches.

Backend: http://127.0.0.1:5000
