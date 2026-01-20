# Quantic_cafe_fausso
University project on backend/front creation for a cafe


# Cafe Fausse (Create React App + Flask + Postgres)

This repo contains a simple full-stack web app:
- Frontend: Create React App + React Router
- Backend: Flask REST API (JSON)
- Database: PostgreSQL (Docker)

## 1) Start Postgres

```bash
docker compose up -d
```

## 2) Backend (Flask)

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt

# The backend now auto-creates tables on startup (handy for `flask run`).
# If you ever want to (re)create tables explicitly, you can still run:
# flask --app app.py init-db

flask --app app.py run --port 5000
```

Health check: `GET http://localhost:5000/api/health`

## 3) Frontend (Create React App)

```bash
cd frontend
npm install
npm start
```

App: http://localhost:3000

## Images

Place images in `frontend/public/images/` and keep names used in `frontend/src/data/gallery.js`.

