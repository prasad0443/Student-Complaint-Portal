# Deploy to Render (100% free)

Deploy SCP for **$0/month** using:

| Service | Free tier |
|---------|-----------|
| **Render** | Free web service (sleeps after 15 min idle, ~30s wake) |
| **MongoDB Atlas** | M0 cluster (512 MB) |
| **Storage** | `local` (default) — or Cloudflare R2 free for persistent attachments |
| **SMTP** | Optional — emails log to Render console if unset |

## Quick deploy (3 steps)

### Step 1 — MongoDB Atlas (5 min, free)

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register).
2. Create a **free M0** cluster (any cloud/region).
3. **Database Access** → Add user (username + password, read/write any DB).
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
5. **Connect** → Drivers → copy the URI. Replace `<password>` and add a DB name:

```
mongodb+srv://myuser:MyP%40ssw0rd@cluster0.xxxxx.mongodb.net/student_complaint_portal
```

(URL-encode special characters in the password, e.g. `@` → `%40`)

### Step 2 — Push code to GitHub

```bash
cd scp
git init
git add .
git commit -m "Initial commit"
```

Create a repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USER/scp.git
git branch -M main
git push -u origin main
```

### Step 3 — Deploy on Render (free)

1. [dashboard.render.com](https://dashboard.render.com) → sign up (GitHub login is easiest).
2. **New** → **Blueprint**.
3. Connect your GitHub repo.
4. When asked for env vars, set **only**:
   - `MONGODB_URI` = your Atlas connection string from Step 1
5. Click **Apply**.

Render auto-generates `JWT_SECRET` and sets `CLIENT_URL` from your app URL.

First deploy takes ~5–10 min. Your app will be at:

```
https://student-complaint-portal.onrender.com
```

(Exact name may vary — check the Render dashboard.)

## After deploy

### Health check

Open `https://<your-app>.onrender.com/api/health`

```json
{ "ok": true, "db": "connected", ... }
```

### Create admin account (one-time, from your PC)

```bash
set MONGODB_URI=mongodb+srv://...
npm run seed
```

Then sign in at `/admin/login`:

- Email: `admin@scp.edu`
- Password: `admin123`

Change this password after first login in production.

### Cold starts (free tier)

The app **sleeps** after ~15 minutes with no traffic. First visit after sleep takes **30–60 seconds**. This is normal on Render free.

## Free tier limitations

| Limitation | Workaround |
|------------|------------|
| App sleeps when idle | Upgrade to Starter ($7/mo) for always-on |
| Attachments lost on redeploy | Add free Cloudflare R2 (see below) |
| No password-reset emails | Configure SMTP, or read links in Render **Logs** |
| 750 hrs/month cap | Enough for one always-sleeping demo app |

## Optional: free persistent attachments (Cloudflare R2)

R2 free tier: 10 GB storage, no egress fees to internet.

1. Cloudflare dashboard → **R2** → Create bucket.
2. **Manage R2 API Tokens** → Create token (Object Read & Write).
3. In Render → your service → **Environment**, add:

| Variable | Value |
|----------|-------|
| `STORAGE_PROVIDER` | `s3` |
| `S3_BUCKET` | your bucket name |
| `S3_REGION` | `auto` |
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY` | token access key |
| `S3_SECRET_KEY` | token secret |
| `S3_FORCE_PATH_STYLE` | `true` |

Save → Render redeploys automatically.

## Optional: free email (password reset)

Use [Brevo](https://www.brevo.com) (free 300 emails/day) or Gmail app password:

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-login
SMTP_PASS=your-brevo-smtp-key
EMAIL_FROM=SCP Portal <noreply@yourdomain.com>
```

Without SMTP, forgot-password links appear in **Render → Logs**.

## Manual setup (without Blueprint)

| Setting | Value |
|---------|-------|
| Runtime | Node |
| Plan | **Free** |
| Build Command | `bash scripts/render-build.sh` |
| Start Command | `npm start --prefix server` |
| Health Check Path | `/api/health` |

Env vars: `NODE_ENV=production`, `TRUST_PROXY=true`, `JWT_SECRET` (generate), `MONGODB_URI`.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build failed | Check **Logs** tab; ensure `package-lock.json` files are in the repo |
| `db: disconnected` | Fix Atlas URI; confirm Network Access allows `0.0.0.0/0` |
| Slow first load | Free tier waking up — wait 30–60s |
| CORS error | Set `CLIENT_URL` to your exact Render URL if using custom domain |
| Upload works then files vanish | Expected with `local` storage — add R2 |

## Upgrade path

| Need | Action |
|------|--------|
| Always on | Render → change plan to Starter ($7/mo) |
| Persistent files | Add R2 env vars (still free at low volume) |
| Custom domain | Render Settings → Custom Domains → set `CLIENT_URL` |
