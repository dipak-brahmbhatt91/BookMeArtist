# BookMeArtist — Complete Setup & Hosting Guide

> **Version:** 1.0 | **Stack:** Node.js 24 · React · PostgreSQL · pnpm workspaces

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure Quick Reference](#2-project-structure-quick-reference)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Local Development Setup](#4-local-development-setup)
5. [Database Setup](#5-database-setup)
6. [Hosting Option A — Replit (Current / Recommended)](#6-hosting-option-a--replit-current--recommended)
7. [Hosting Option B — Railway](#7-hosting-option-b--railway)
8. [Hosting Option C — Render](#8-hosting-option-c--render)
9. [Hosting Option D — VPS / Ubuntu Server (DigitalOcean, Linode, Hetzner)](#9-hosting-option-d--vps--ubuntu-server)
10. [Hosting Option E — Docker (any cloud)](#10-hosting-option-e--docker-any-cloud)
11. [Hosting Option F — Vercel (Frontend) + Railway (API)](#11-hosting-option-f--vercel-frontend--railway-api)
12. [Production Checklist](#12-production-checklist)
13. [First Login & Admin Setup](#13-first-login--admin-setup)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | **20** (24 recommended) | https://nodejs.org |
| pnpm | **9** | `npm install -g pnpm` |
| PostgreSQL | **14** | https://postgresql.org |
| Git | any | https://git-scm.com |

---

## 2. Project Structure Quick Reference

```
workspace/
├── artifacts/
│   ├── api-server/          ← Express REST API (Node.js)
│   └── bookmeartist/        ← React + Vite frontend SPA
├── lib/
│   ├── db/                  ← Drizzle ORM schema + DB client
│   ├── api-client-react/    ← Generated React Query client hooks
│   ├── api-spec/            ← OpenAPI 3.0 spec
│   └── api-zod/             ← Generated Zod schemas
├── docs/                    ← Technical documentation (you are here)
├── scripts/                 ← Seed scripts
├── pnpm-workspace.yaml
└── package.json
```

**Key ports (development):**
- Frontend (Vite): `$PORT` env var (default any available)
- API Server: `8080`

**URL routing:**
- `/` and all non-`/api` paths → Frontend SPA
- `/api/*` → Express API server

---

## 3. Environment Variables Reference

### API Server (required)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:5432/dbname` | PostgreSQL connection string |
| `SESSION_SECRET` | **Yes** | `a-long-random-string-32+chars` | Signs session cookies. Must be at least 32 characters. Use a random generator. |
| `NODE_ENV` | Yes | `production` | Set to `production` in any live environment |
| `PORT` | Yes | `8080` | Port the API server listens on |

### Frontend (Vite build)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `3000` | Port the Vite dev server uses |
| `BASE_PATH` | Yes | `/` | URL base path. Use `/` unless you're mounting the app at a subdirectory (e.g. `/app`) |
| `VITE_API_URL` | No | `` | Leave blank — the app auto-detects the API from the same origin. Only set if API is on a completely different domain. |

### Generating a secure SESSION_SECRET

```bash
# Option 1 — Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Option 2 — openssl
openssl rand -hex 48
```

---

## 4. Local Development Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd bookmeartist

# 2. Install all dependencies (runs for all workspace packages)
pnpm install

# 3. Create a PostgreSQL database
createdb bookmeartist
# Or via psql:
# psql -c "CREATE DATABASE bookmeartist;"

# 4. Create environment files

# API server environment file
cat > artifacts/api-server/.env << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/bookmeartist
SESSION_SECRET=replace-this-with-a-random-64-char-string
NODE_ENV=development
PORT=8080
EOF

# Frontend environment file
cat > artifacts/bookmeartist/.env << 'EOF'
PORT=3000
BASE_PATH=/
EOF

# 5. Push the database schema (creates all tables)
pnpm --filter @workspace/db run db:push

# 6. Start both servers (two separate terminals)

# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/bookmeartist run dev
```

The app auto-seeds on first startup:
- Categories, artists, bookings, and applications are seeded if the database is empty
- Admin user `admin` / `admin123` is created automatically

**Access the app:**
- Frontend: http://localhost:3000
- API: http://localhost:8080/api/health
- Admin panel: http://localhost:3000/admin

> **Important:** In local development, the frontend makes API requests to `/api/*`. Your browser sends these to `localhost:3000`, but without a proxy the requests won't reach port 8080. You need either a Vite proxy (see below) or to run both on the same origin via a reverse proxy (nginx, Caddy).

### Option A — Vite proxy for local development

Add this to `artifacts/bookmeartist/vite.config.ts` inside `defineConfig`:

```ts
server: {
  port,
  host: "0.0.0.0",
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
},
```

### Option B — Local nginx proxy

```nginx
server {
  listen 80;
  server_name localhost;

  location /api {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

## 5. Database Setup

### First-time setup

The database schema is managed by **Drizzle ORM**. You never write SQL migrations manually.

```bash
# Push the schema to your database (creates/updates all tables)
pnpm --filter @workspace/db run db:push
```

### Re-seed demo data

If you want to wipe and re-seed the demo data:

```bash
# Option 1: Truncate tables and let the server re-seed on next startup
psql $DATABASE_URL -c "TRUNCATE categories, artists, bookings, users, applications RESTART IDENTITY CASCADE;"

# Option 2: Run the seed script directly
pnpm --filter @workspace/scripts run seed

# Option 3: Re-seed just the admin user
pnpm --filter @workspace/scripts run seed-admin
```

### Schema changes (development)

Edit files in `lib/db/src/schema/`, then:

```bash
pnpm --filter @workspace/db run db:push
```

---

## 6. Hosting Option A — Replit (Current / Recommended)

This is the platform the app was built on. Zero configuration needed for a fresh Replit import.

### Steps

1. Go to https://replit.com and create an account
2. Click **+ Create Repl** → **Import from GitHub** (paste your repo URL)
3. Replit detects the pnpm workspace automatically
4. Click the **Secrets** tab (padlock icon) → Add:
   - `SESSION_SECRET` = (generate with `openssl rand -hex 48`)
5. Click the **Database** tab → Enable PostgreSQL (Replit provides `DATABASE_URL` automatically)
6. Click **Run** — the app starts, seeds itself, and is live
7. To publish: Click **Deploy** → **Autoscale** → follow the prompts

### Custom domain on Replit

1. Deploy the app first (you get a `.replit.app` URL)
2. Go to Deployments → **Custom Domain**
3. Enter your domain (e.g. `bookmeartist.com`)
4. Replit shows you a CNAME record to add
5. In your domain registrar's DNS panel, add:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: <the value Replit gives you>
   TTL: 3600
   ```
6. Wait up to 48 hours for DNS propagation

---

## 7. Hosting Option B — Railway

Railway is the simplest cloud option after Replit. It runs Node.js services with zero Dockerfile needed.

### Steps

1. Go to https://railway.app and sign up
2. Click **New Project** → **Deploy from GitHub repo** → select your repository
3. Railway detects the monorepo but you need two services. Create them manually:

**Service 1 — API Server:**
- Click **+ New Service** → **GitHub Repo** → your repo
- Settings → Build Command: `pnpm install && pnpm --filter @workspace/api-server run build`
- Settings → Start Command: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
- Environment Variables:
  ```
  DATABASE_URL    = (Railway PostgreSQL — see step 4)
  SESSION_SECRET  = (generate with openssl rand -hex 48)
  NODE_ENV        = production
  PORT            = 8080
  ```

**Service 2 — Frontend:**
- Click **+ New Service** → **GitHub Repo** → your repo
- Settings → Build Command: `pnpm install && pnpm --filter @workspace/bookmeartist run build`
- Settings → Start Command: `npx serve -s artifacts/bookmeartist/dist/public -l 3000`
- Environment Variables:
  ```
  PORT       = 3000
  BASE_PATH  = /
  NODE_ENV   = production
  ```

4. **Add PostgreSQL:** Click **+ New** → **Database** → **PostgreSQL**. Railway injects `DATABASE_URL` automatically into services in the same project.

5. **Route `/api` to the API service:**
   - In Railway, go to your project settings → **Networking**
   - Set the API service to handle routes starting with `/api`
   - Set the frontend service to handle all other routes (`/`)
   - Or use Railway's custom domain with a reverse proxy (nginx config below)

### Alternative: Single Railway service with nginx

Create a `Procfile` in the root:
```
web: pnpm --filter @workspace/api-server run start & npx serve -s artifacts/bookmeartist/dist/public -l 3000 & nginx -g 'daemon off;'
```

---

## 8. Hosting Option C — Render

Render supports Node.js services with automatic deploys from GitHub.

### Steps

1. Go to https://render.com and sign up
2. Create a PostgreSQL database first:
   - Dashboard → **New** → **PostgreSQL**
   - Copy the **Internal Database URL** for use in services

**Service 1 — API Server:**
- **New** → **Web Service** → connect GitHub repo
- Name: `bookmeartist-api`
- Runtime: **Node**
- Build Command: `pnpm install && pnpm --filter @workspace/api-server run build`
- Start Command: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
- Environment:
  ```
  DATABASE_URL   = (from your Render PostgreSQL service)
  SESSION_SECRET = (generate with openssl rand -hex 48)
  NODE_ENV       = production
  PORT           = 10000
  ```

**Service 2 — Frontend (Static Site):**
- **New** → **Static Site** → connect GitHub repo
- Name: `bookmeartist-web`
- Build Command: `pnpm install && pnpm --filter @workspace/bookmeartist run build`
- Publish Directory: `artifacts/bookmeartist/dist/public`
- Environment:
  ```
  BASE_PATH = /
  ```
- Rewrite rules (for SPA routing):
  - Source: `/*`
  - Destination: `/index.html`
  - Action: Rewrite

**Routing API calls from the static site to the API:**

Since the static site and API are on different Render URLs, you need to configure the API URL. Add to `artifacts/bookmeartist/src/main.tsx`:

```ts
import { setBaseUrl } from "@workspace/api-client-react";
setBaseUrl("https://bookmeartist-api.onrender.com");
```

Or set it via environment variable during the build:
```bash
VITE_API_URL=https://bookmeartist-api.onrender.com
```

And update `lib/api-client-react/src/custom-fetch.ts` to read it:
```ts
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}
```

---

## 9. Hosting Option D — VPS / Ubuntu Server

Use this for DigitalOcean Droplets, Linode, Hetzner, or any Ubuntu VPS.

### Server setup (one-time)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install nginx
sudo apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### PostgreSQL setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER bookmeartist WITH PASSWORD 'your_strong_password';
CREATE DATABASE bookmeartist OWNER bookmeartist;
GRANT ALL PRIVILEGES ON DATABASE bookmeartist TO bookmeartist;
\q
```

### Deploy the app

```bash
# Clone your repository
cd /var/www
git clone <your-repo-url> bookmeartist
cd bookmeartist

# Install dependencies
pnpm install

# Create .env for the API server
cat > artifacts/api-server/.env << 'EOF'
DATABASE_URL=postgresql://bookmeartist:your_strong_password@localhost:5432/bookmeartist
SESSION_SECRET=your-64-char-random-secret-here
NODE_ENV=production
PORT=8080
EOF

# Set frontend env
cat > artifacts/bookmeartist/.env << 'EOF'
BASE_PATH=/
PORT=3000
NODE_ENV=production
EOF

# Build both services
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/bookmeartist run build

# Push database schema
pnpm --filter @workspace/db run db:push

# Install static file server for the frontend
npm install -g serve
```

### PM2 process management

```bash
# Create ecosystem file
cat > /var/www/bookmeartist/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "bookmeartist-api",
      script: "node",
      args: "--enable-source-maps artifacts/api-server/dist/index.mjs",
      cwd: "/var/www/bookmeartist",
      env: {
        NODE_ENV: "production",
        PORT: "8080",
      },
      env_file: "artifacts/api-server/.env",
    },
    {
      name: "bookmeartist-web",
      script: "serve",
      args: "-s artifacts/bookmeartist/dist/public -l 3000",
      cwd: "/var/www/bookmeartist",
    },
  ],
};
EOF

# Start both services
pm2 start ecosystem.config.js

# Save process list and set up auto-start on reboot
pm2 save
pm2 startup
# Run the command PM2 outputs
```

### nginx reverse proxy config

```bash
sudo nano /etc/nginx/sites-available/bookmeartist
```

Paste:

```nginx
server {
    listen 80;
    server_name bookmeartist.com www.bookmeartist.com;

    # API — forward to Express
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "keep-alive";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend — forward to Vite / serve
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/bookmeartist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL/HTTPS with Let's Encrypt (free)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bookmeartist.com -d www.bookmeartist.com
```

Certbot automatically updates your nginx config to use HTTPS and sets up auto-renewal.

> **After enabling HTTPS:** Make sure the API server's session config trusts the proxy. This is already done — `app.set("trust proxy", 1)` is in `artifacts/api-server/src/app.ts`.

### Automatic deploys (CI/CD)

Add a deploy script:

```bash
cat > /var/www/bookmeartist/deploy.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/bookmeartist
git pull origin main
pnpm install
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/bookmeartist run build
pnpm --filter @workspace/db run db:push
pm2 restart all
echo "Deploy complete"
EOF

chmod +x /var/www/bookmeartist/deploy.sh
```

---

## 10. Hosting Option E — Docker (any cloud)

Use this for AWS ECS, Google Cloud Run, Azure Container Apps, or any Docker-compatible host.

### Dockerfile — API server

Create `artifacts/api-server/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install deps
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter @workspace/api-server run build

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
```

### Dockerfile — Frontend

Create `artifacts/bookmeartist/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY lib/ ./lib/
COPY artifacts/bookmeartist/ ./artifacts/bookmeartist/

RUN pnpm install --frozen-lockfile

ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
RUN pnpm --filter @workspace/bookmeartist run build

# Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/artifacts/bookmeartist/dist/public /usr/share/nginx/html
COPY artifacts/bookmeartist/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Create `artifacts/bookmeartist/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### docker-compose.yml (for self-hosting)

Create in project root:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bookmeartist
      POSTGRES_USER: bookmeartist
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bookmeartist"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: artifacts/api-server/Dockerfile
    environment:
      DATABASE_URL: postgresql://bookmeartist:${POSTGRES_PASSWORD:-changeme}@postgres:5432/bookmeartist
      SESSION_SECRET: ${SESSION_SECRET}
      NODE_ENV: production
      PORT: 8080
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8080:8080"

  web:
    build:
      context: .
      dockerfile: artifacts/bookmeartist/Dockerfile
      args:
        BASE_PATH: /
    ports:
      - "80:80"

volumes:
  pgdata:
```

**.env file for docker-compose:**

```env
POSTGRES_PASSWORD=your_secure_password_here
SESSION_SECRET=your_64_char_random_secret_here
```

**Run:**

```bash
docker-compose up -d

# Push database schema (first time only)
docker-compose exec api pnpm --filter @workspace/db run db:push
```

---

## 11. Hosting Option F — Vercel (Frontend) + Railway (API)

This is a popular combination for teams that want serverless frontend delivery.

### Frontend on Vercel

1. Push your code to GitHub
2. Go to https://vercel.com → **New Project** → Import your repo
3. Set the following in Vercel project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `artifacts/bookmeartist`
   - **Build Command:** `cd ../.. && pnpm install && pnpm --filter @workspace/bookmeartist run build`
   - **Output Directory:** `dist/public`
4. Environment Variables:
   ```
   BASE_PATH  = /
   NODE_ENV   = production
   VITE_API_URL = https://your-api-url.railway.app
   ```
5. Add a `vercel.json` in `artifacts/bookmeartist/`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### API on Railway

Follow **Hosting Option B** steps for Service 1 (API Server only).

### Connecting frontend to API

In `artifacts/bookmeartist/src/main.tsx`, add:

```ts
import { setBaseUrl } from "@workspace/api-client-react";

if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL as string);
}
```

> **CORS:** When frontend and API are on different domains, you must configure CORS on the API server. In `artifacts/api-server/src/app.ts`, update the CORS config:
>
> ```ts
> app.use(cors({
>   origin: "https://your-vercel-app.vercel.app",
>   credentials: true,
> }));
> ```

---

## 12. Production Checklist

Before going live, verify every item:

### Security

- [ ] `SESSION_SECRET` is a random string of at least 32 characters
- [ ] `SESSION_SECRET` is stored in environment variables, NOT in code
- [ ] Change the default admin password (`admin123`) via the admin panel at `/admin/security`
- [ ] `NODE_ENV=production` is set on the API server
- [ ] HTTPS is enabled (TLS certificate installed)
- [ ] `robots.txt` blocks `/admin`, `/dashboard`, `/api/` from search engines (already done)

### Database

- [ ] `DATABASE_URL` points to your production database
- [ ] Schema has been pushed: `pnpm --filter @workspace/db run db:push`
- [ ] Database has regular automated backups configured

### Performance

- [ ] Frontend is built (`pnpm --filter @workspace/bookmeartist run build`) and served as static files
- [ ] API server is built (`pnpm --filter @workspace/api-server run build`) and running from `dist/`
- [ ] A process manager (PM2, systemd, or Docker) restarts the API on crashes

### Networking

- [ ] `/api/*` routes proxy to the API server
- [ ] All other routes serve the frontend SPA with a `/* → /index.html` fallback
- [ ] `trust proxy` is configured if behind a reverse proxy (already set in `app.ts`)

---

## 13. First Login & Admin Setup

After deployment, the first startup automatically:
1. Creates all database tables
2. Seeds categories, 13+ artist profiles, bookings, and applications
3. Creates the admin user: **username:** `admin` | **password:** `admin123`

### Immediate post-deployment steps

1. Go to `https://yourdomain.com/admin` (direct URL — not linked in the public site)
2. Log in with `admin` / `admin123`
3. Go to **Security** in the sidebar
4. Change the admin username and password
5. Go to **Artists** → review and clean up demo seed data if needed
6. Go to **Users** → create artist accounts and link them to artist profiles

### Creating an artist login

1. Admin panel → **Artists** → create or edit an artist profile
2. Admin panel → **Users** → **Create User**
   - Username: (artist's login name)
   - Password: (temporary password to share with the artist)
   - Role: `artist`
   - Linked Artist: select their profile from the dropdown
3. Share the login credentials with the artist — they log in at `/login`

---

## 14. Troubleshooting

### "Failed to send booking request"

**Cause:** The `budget` field was sent as a number but the schema expected a string.
**Status:** Fixed in the current codebase. The API now coerces `budget` to a string automatically.

---

### Sessions not persisting (logged out on refresh)

**Check 1:** Is `SESSION_SECRET` set? If it changes between restarts, all existing sessions are invalidated.

**Check 2:** Behind a reverse proxy? Make sure `trust proxy 1` is set in the API server (it is by default in `app.ts`).

**Check 3:** Is the cookie `bma.sid` being set? Open browser DevTools → Application → Cookies. If missing, the login endpoint returned an error.

---

### Database connection errors

```bash
# Test the connection string directly
psql $DATABASE_URL -c "SELECT 1;"

# Common issues:
# - Missing ssl=true for hosted databases (add ?sslmode=require to DATABASE_URL)
# - Firewall blocking port 5432
# - Wrong password
```

For hosted PostgreSQL services (Supabase, Neon, Railway, etc.), you usually need:
```
postgresql://user:pass@host:5432/dbname?sslmode=require
```

---

### "Cannot find module" errors on startup

```bash
# Rebuild from scratch
pnpm install
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/bookmeartist run build
```

---

### Frontend shows blank page or 404

**Check 1:** Is the SPA rewrite rule in place? All routes must fall back to `/index.html`.

**Check 2:** Is `BASE_PATH` set correctly? If the app is served at `/app`, set `BASE_PATH=/app`.

**Check 3:** Are API calls going to the right URL? Open browser DevTools → Network and look at failed API requests. The URL should be `/api/...`.

---

### Admin panel redirects to /login unexpectedly

The admin session cookie only works if:
1. You're on the same domain/protocol as the API
2. The `SESSION_SECRET` hasn't changed since you logged in
3. `NODE_ENV=production` and HTTPS are both set (required for `Secure` cookie flag)

If running locally with HTTP, set `NODE_ENV=development` on the API server.

---

### Port conflicts

By default, the API runs on port `8080`. If another process is using it:

```bash
# Find what's using the port
lsof -i :8080

# Change the port
PORT=8090 pnpm --filter @workspace/api-server run dev
```

---

*BookMeArtist Setup Guide — v1.0 · April 2026*
