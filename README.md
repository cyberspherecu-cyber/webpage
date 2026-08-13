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

> **✅ Data persistence (Supabase):** The backend stores all data (site content, events, challenges, signups, leaderboards, blog posts, …) in **Supabase Postgres** and all uploaded files in **Supabase Storage**, so admin edits and uploads survive restarts, redeploys, and scale-to-zero — no persistent disk required. Set these env vars on your host (they're already in `render.yaml`):
> - `SUPABASE_URL` — Project Settings → **API** → Project URL
> - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → **API** → secret key (server-side, bypasses RLS)
>
> The app talks to Supabase over its REST API with the secret key, so **no Postgres connection string is needed**. One-time setup: run this SQL in the Supabase **SQL Editor** so the app has a place to store its data:
> ```sql
> CREATE TABLE IF NOT EXISTS cysec_data (key text PRIMARY KEY, value jsonb NOT NULL);
> ```
> (If the table is missing, the app refuses to start and prints this exact line with a link to your SQL Editor.) The `uploads` storage bucket is created automatically on first boot, and the default site data is seeded automatically.
>
> **Optional:** if you provide a `DATABASE_URL` (Project Settings → Database → Connection string) the app creates the table automatically on first boot instead of needing the SQL step — but note direct connections are IPv6-only unless Supabase's paid IPv4 add-on is enabled.
>
> **Local dev without any of these env vars still works** — the backend falls back to the original `data.db.json` file + local `uploads/` folder.

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
| `ADMIN_EMAIL` | Email for the `/admin` dashboard login | `sawanyadav3010@gmail.com` |
| `ADMIN_PASSWORD` | Password used to seed the admin account on **first boot only** | `CyberSphere@2025` (change this!) |
| `SUPABASE_URL` | Your Supabase project URL (Project Settings → API) | *(unset → local file fallback)* |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (server-side, bypasses RLS) | *(unset → local file fallback)* |
| `DATABASE_URL` | *(optional)* Supabase Postgres connection string — auto-creates the data table on first boot | *(unset → use the one-line SQL setup instead)* |

When `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, the app persists everything to Supabase (table must exist — see the one-time SQL above). Without them, the original `data.db.json` file is used so local dev keeps working.

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

It's protected by an **admin account stored in the database** — seeded once from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first boot, then managed entirely in the DB (Supabase table or `data.db.json`). Changing `ADMIN_PASSWORD` in the env later does **not** update an already-seeded account; update it in the database instead:

- **From the app:** `PUT /api/admin/password` with `{ currentPassword, newPassword }` (requires an admin token).
- **From a script:** `db.updateAdminPassword(email, newPasswordHash)` (see `backend/db.js`).

If you use the `render.yaml` blueprint, the admin is seeded with the `ADMIN_PASSWORD` value you set there. ⚠️ Change the default before going live — the server logs a warning if `ADMIN_PASSWORD` is unset.

---

## 5. What's already handled for hosting

- No hardcoded `localhost` URLs — the frontend reads the API URL from `VITE_API_URL` at build time.
- SPA rewrite rules included for both Vercel (`vercel.json`) and Netlify (`netlify.toml` + `public/_redirects`) so routes like `/register` don't 404 on refresh.
- Backend reads `PORT`, `JWT_SECRET`, and `CORS_ORIGIN` from the environment instead of hardcoding them.
- `GET /api/health` endpoint for host uptime checks.
- `.gitignore` in both folders so `node_modules`, build output, and `.env` files (with real secrets) never get committed.
