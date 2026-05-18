# InternSync — Demo setup (PostgreSQL + seeded data)

Run these steps before a presentation so `/match` returns listings from the database.

## 1. PostgreSQL

Create the database (once):

```bash
createdb internsync
```

Default connection in `app.py`:

`postgresql://localhost/internsync`

## 2. Python environment

```bash
cd Backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Create tables + demo user

```bash
python init_db.py
```

This creates tables and a **demo account** used by the frontend (no login UI):

- Email: `internsync.demo@local`
- Password: `demo-internsync-local`

If you already ran `init_db.py` before the `kanban_board` column was added, run:

```bash
python init_db.py
```

If the column is still missing, drop and recreate the DB or run:

```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kanban_board TEXT;
```

## 4. Seed internships (GitHub README scrape → DB)

Start Flask once, then trigger a scrape or use your team’s cron job. Minimum check:

```bash
python app.py
```

In another terminal:

```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/summer
```

If `summer` returns `[]`, run the scraper/cron your team added (`cron.py`) or hit the route that populates `internships`.

## 5. Frontend

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173` — profile and Kanban persist via `/profile/save` and `/profile/load` using the demo user.

## 6. Quick troubleshooting

| Problem | Fix |
|---------|-----|
| `Could not load matches` | Flask not running, or DB has no internships |
| `Profile not found` | Run `python init_db.py` |
| CORS errors | Backend must allow `localhost:5173` and `127.0.0.1:5173` |
| Empty match list | Seed DB; profile needs at least one language/course/interest tag |
