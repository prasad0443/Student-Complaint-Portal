# Student Complaint Portal (SCP)

Full-stack app: **React (Vite) + Tailwind**, **Node.js + Express**, **MongoDB (Mongoose)**, **JWT**, **bcrypt**, **Socket.io**, **Nodemailer** (optional SMTP), **PDF export** (admin).

## Folder layout

```
scp/
├── client/                 # React SPA
│   ├── src/
│   │   ├── api/            # Axios client
│   │   ├── components/     # Layout, Sidebar, Spinner
│   │   ├── context/        # Auth, theme (dark mode)
│   │   ├── hooks/          # useSocket
│   │   ├── pages/          # Login, Register, dashboards, complaint flows
│   │   └── utils/
│   └── ...
├── server/
│   ├── config/             # db, email
│   ├── controllers/
│   ├── middleware/         # auth, upload, validate, errors
│   ├── models/             # User, Complaint, Counter
│   ├── routes/
│   ├── scripts/seed.js     # Sample users + complaints
│   ├── uploads/            # Attachment storage (gitignored files)
│   └── utils/
└── package.json            # concurrently: dev client + server
```

`models/`, `routes/`, `controllers/`, and `middleware/` are under `server/` so the API is self-contained.

## Prerequisites

- Node.js 18+
- MongoDB running locally or a connection string

## Setup

1. **Server env**

   ```bash
   copy server\.env.example server\.env
   ```

   Edit `server\.env`: set `MONGODB_URI`, `JWT_SECRET`, and optionally SMTP for real email (otherwise emails are logged to the console).

2. **Install**

   ```bash
   npm install
   cd server && npm install && cd ../client && npm install
   ```

3. **Seed sample data** (optional)

   ```bash
   npm run seed
   ```

   - Admin: `admin@scp.edu` / `admin123`
   - Students: `alice@student.edu` / `student123` (ID `STU2026001`), `bob@student.edu` / `student123`

4. **Run**

   ```bash
   npm run dev
   ```

   - API: `http://localhost:5000`
   - App: `http://localhost:5173` (Vite proxies `/api`, `/socket.io`, `/uploads`)

## Production

```bash
npm run build          # builds client/dist
set NODE_ENV=production && npm start   # Express serves API + SPA on :5000
```

Or use Docker: `docker compose up --build` (see **[DEPLOYMENT.md](DEPLOYMENT.md)** for VPS, HTTPS, and env vars).

**Deploy free on Render:** see **[RENDER.md](RENDER.md)** (Render free + Atlas M0 — only `MONGODB_URI` required).

Production hardening includes Helmet, rate limiting, env validation, graceful shutdown, DB health checks, S3 uploads, Redis Socket.io scaling, password reset, CI tests, and pagination/stats on dashboards.

## Tests

```bash
npm test    # server integration tests (auth, complaints, password reset)
```

CI runs tests + client build + Docker build on every push (see `.github/workflows/ci.yml`).

## REST API

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Student signup (studentId, email, password, name) |
| POST | `/api/auth/login` | Body: `identifier` (email or student ID) + `password` |
| POST | `/api/auth/forgot-password` | `{ email }` — sends reset link (SMTP or console log) |
| POST | `/api/auth/reset-password` | `{ email, token, password }` |
| GET | `/api/auth/me` | JWT required |
| GET | `/api/complaints` | Student: own complaints; admin: all. Query: `category`, `priority`, `status`, `from`, `to`, `search`, `page`, `limit` |
| GET | `/api/complaints/stats/summary` | Complaint counts by status (scoped to role) |
| GET | `/api/health` | Liveness + MongoDB + Redis + storage provider |
| GET | `/api/files/*` | JWT required; streams S3 attachments |
| POST | `/api/complaints` | Student only; `multipart/form-data`: fields + `attachments[]` |
| GET | `/api/complaints/:id` | Owner or admin |
| PUT | `/api/complaints/:id` | Admin: status, priority, department, notes, timeline note |
| DELETE | `/api/complaints/:id` | Admin any; student only while `status === submitted` |
| GET | `/api/complaints/export/pdf` | Admin; respects same filters as list |
| GET | `/api/analytics/summary` | Admin charts data |

Complaint IDs: `SCP-YYYY-NNNN` (per-year counter).

## Security notes

- Passwords hashed with bcrypt (cost 12) on `User` save.
- Input validation: `express-validator` on auth and complaint mutations.
- JWT on protected routes; role checks for admin vs student actions.
- Helmet headers and rate limiting on API/auth routes (production).
- Uploads: images + PDF only, size limit 5MB per file.

## Real-time

Socket.io authenticates with the same JWT (`auth.token`). Events: `complaint:created`, `complaint:updated`, `complaint:deleted`. Set `REDIS_URL` for horizontal scaling across multiple server instances.
