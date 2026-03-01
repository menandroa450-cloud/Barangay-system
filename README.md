# Barangay Attendance System — Full‑Stack Capstone (Next.js + Prisma DB)

This project wraps your existing **React App.jsx** UI inside a modern **Next.js** full‑stack app, and adds a real backend + database.

## What you get
- ✅ Your existing website/UI (no redesign)
- ✅ Backend API (Next.js Route Handlers)
- ✅ Database (Prisma + SQLite by default)
- ✅ Automatic "Cloud Sync" (mirrors localStorage → DB silently)

> The UI still works offline with localStorage. When the server is running, it will also sync to the DB.

---

## 1) Install requirements
- Node.js 18+ (recommended: Node 20)

---

## 2) Setup (first time)

### A) Install dependencies
```bash
npm install
```

### B) Create your local .env
Copy the example env file:
```bash
cp .env.example .env
```

### C) Create the database (Prisma migrate)
```bash
npm run db:migrate
```

This will create `prisma/dev.db` and generate Prisma client.

---

## 3) Run the project
```bash
npm run dev
```

Open:
- http://localhost:3000

---

## 4) Verify the backend + DB works

### A) Use the app normally
- Add employees/admins
- Time in/out
- Edit schedule
- etc.

### B) Check the DB contents
Run Prisma Studio:
```bash
npm run db:studio
```
It opens a browser UI where you can view:
- `User`
- `AttendanceRecord`

---

## 5) API endpoints (for documentation/demo)
- `GET /api/bootstrap` → returns users + records stored in DB
- `POST /api/sync` → upserts users + records (used by the UI sync)

---

## 6) Switching to PostgreSQL (optional, for “more professional” capstone)
1. Create a Postgres DB (Supabase / Railway / Render / local)
2. Edit `.env`:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
```
3. Update `prisma/schema.prisma` datasource:
```prisma
provider = "postgresql"
```
4. Run migration again:
```bash
npm run db:migrate
```

---

## Notes for your defense/presentation
- Frontend: React (your UI) inside Next.js
- Backend: Next.js API routes (`app/api/*`)
- Database: Prisma ORM + SQL DB (SQLite/Postgres)
- Sync strategy: local-first + cloud mirror (safe for demos even offline)

---

Made on 2026-02-10.


## Troubleshooting (Windows / localStorage / SSR)
- This project disables SSR for your legacy React UI using `dynamic(..., { ssr:false })` in `app/page.tsx`
  so browser-only APIs like `localStorage` work exactly like your original React app.


---

## Real Login (Username/Password)
After the DB migration, seed demo accounts:

```bash
npm run db:seed
```

Demo accounts:
- admin / admin123
- employee / employee123

Login page:
- http://localhost:3000/login

---

## Reports Export (PDF / Excel)
Admin can download:
- Excel: `/api/reports/attendance.xlsx`
- PDF: `/api/reports/attendance.pdf`
or open:
- http://localhost:3000/reports

---

## Deployment (Vercel + Postgres) — Step by step

### 1) Create a Postgres database
Recommended:
- Supabase (Postgres) or Railway (Postgres)

Copy the connection string as `DATABASE_URL`.

### 2) Update Prisma datasource
In `prisma/schema.prisma` set:
```prisma
provider = "postgresql"
```

### 3) Set environment variables in Vercel
Add these in Vercel → Project → Settings → Environment Variables:
- `DATABASE_URL` = your Postgres URL
- `AUTH_SECRET` = long random string

### 4) Deploy
- Push the project to GitHub
- Import repo in Vercel
- Build command: `npm run build`
- Install command: `npm install`

### 5) Run migrations on deploy
In Vercel, add a “Postinstall” hook via package.json or run manually in CI.
Simplest for capstone: run once locally against the prod DB:
```bash
npx prisma migrate deploy
npm run db:seed
```

---

## ERD Diagram
See: `docs/erd.png`
