# Cysecsphere

A cybersecurity club website with events, a team page, a CTF challenge arena with login/leaderboard, and a membership registration system.

```
cybersphere/
├── frontend/     React + Vite site (public pages, CTF UI, login/register)
├── backend/      Express API (auth, challenges, leaderboard, member registrations)
└── render.yaml   One-click backend deploy blueprint for Render (optional)
```

---

## 1. Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env   # a working .env is already included — just check the values
npm start
```

Runs on **http://localhost:5000**. Data (accounts, CTF submissions, member registrations) is saved to `backend/data.db.json`, a plain JSON file — no database server to install. It's created automatically the first time the server runs.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # a working .env is already included, pointing at localhost:5000
npm run dev
```

Runs on **http://localhost:5173** (Vite's default) and talks to the backend at the URL in `VITE_API_URL`.

Run both at once from the project root with the included helper scripts:

```bash
./start-backend.sh
./start-frontend.sh
```

---

## 2. Deploying

The frontend and backend are two separate deployments: a **static site** (frontend) and a **Node web service** (backend). Deploy the backend first so you have its live URL to give the frontend.

### Backend → Render (recommended, free tier available)

1. Push this project to a GitHub repo.
2. On [render.com](https://render.com) → **New → Blueprint**, point it at your repo. It will read `render.yaml` at the project root and set up the service automatically (Node web service rooted in `/backend`, with a persistent disk attached — see note below).
   - No blueprint? Create the service manually: **New → Web Service**, root directory `backend`, build command `npm install`, start command `node server.js`.
3. Under the service's **Environment** tab, set:
   - `JWT_SECRET` — a long random string (Render's blueprint generates one for you automatically; if setting up manually, generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `CORS_ORIGIN` — leave as `*` for now; update it once you have your frontend's URL (step below)
4. Deploy. Note the live URL Render gives you, e.g. `https://cysecsphere-api.onrender.com`.

**Other options:** Railway, Fly.io, or any host that runs a persistent Node process work the same way — set the same three env vars (`PORT` is usually auto-set by the platform) and use `node server.js` as the start command.

> **⚠️ Important — data persistence:** This project stores data in a JSON file on disk (`backend/data.db.json`), not a hosted database. That only survives restarts/deploys if your host gives the service a **persistent disk** (the `render.yaml` blueprint requests one). On platforms with an *ephemeral* filesystem (e.g. Vercel serverless functions, plain Heroku dynos), that file is wiped on every restart/deploy — fine for a demo, not for real accounts. For serious production use, swap `backend/db.js` for a real database (Postgres, MongoDB, etc.) — it's the only file that would need to change, since `server.js` only calls its exported functions.

### Frontend → Vercel or Netlify (either works well for a Vite app)

**Vercel**
1. Import the repo, set the project root to `frontend`.
2. Build command `npm run build`, output directory `dist` (Vercel usually detects these automatically for Vite).
3. Add an environment variable: `VITE_API_URL` = your backend's live URL from above.
4. Deploy. `frontend/vercel.json` is already included so client-side routes like `/login` or `/challenges` work on direct load/refresh.

**Netlify**
1. Import the repo, set the base directory to `frontend`.
2. Netlify will pick up `frontend/netlify.toml` automatically (build command `npm run build`, publish directory `dist`, plus the SPA redirect rule).
3. Add an environment variable: `VITE_API_URL` = your backend's live URL.
4. Deploy.

### Finishing touch: lock down CORS

Once your frontend has a live URL, go back to the backend's env vars and set:
```
CORS_ORIGIN=https://your-frontend-url.vercel.app
```
This restricts the API to only accept requests from your actual site instead of `*`.

---

## 3. Environment variables reference

**`backend/.env`**
| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the API listens on | `5000` |
| `JWT_SECRET` | Signs login tokens — must be a long random string in production | dev placeholder (change this!) |
| `CORS_ORIGIN` | Which origin(s) may call the API | `*` |
| `ADMIN_PASSWORD` | Password for the `/admin` dashboard | `admin123` (change this!) |

**`frontend/.env`**
| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | URL of the backend API | `http://localhost:5000` |

Both `frontend/.env.example` and `backend/.env.example` are templates you can copy from; working `.env` files with sane local defaults are already included so the project runs immediately after cloning.

---

## 4. Admin panel

A dashboard at **`/admin`** (linked quietly at the bottom of the site footer) lets club officers view and manage:
- Membership registrations
- CTF accounts
- Event RSVPs
- Live stats (member count, CTF accounts, RSVPs, flags captured)

It's protected by a single shared password, set via `ADMIN_PASSWORD` in `backend/.env`. **Change this from the default (`admin123`) before deploying** — the server logs a warning if you don't. If you use the `render.yaml` blueprint, Render generates a random one for you automatically (find it in the service's Environment tab after deploy).

---

## 5. What's already handled for hosting

- No hardcoded `localhost` URLs — the frontend reads the API URL from `VITE_API_URL` at build time.
- SPA rewrite rules included for both Vercel (`vercel.json`) and Netlify (`netlify.toml` + `public/_redirects`) so routes like `/register` don't 404 on refresh.
- Backend reads `PORT`, `JWT_SECRET`, and `CORS_ORIGIN` from the environment instead of hardcoding them.
- `GET /api/health` endpoint for host uptime checks.
- `.gitignore` in both folders so `node_modules`, build output, and `.env` files (with real secrets) never get committed.
