# BookMeArtist Workspace

## Overview

**BookMeArtist** (www.bookmeartist.com) — A marketplace platform connecting artists with clients who want to book them for events and projects.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/bookmeartist)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: express-session + bcryptjs (session-based, not JWT)
- **Build**: esbuild (ESM bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── bookmeartist/       # React + Vite frontend (main web app)
│   └── api-server/         # Express API server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   ├── src/seed.ts         # Database seeder (artists, categories, bookings)
│   └── src/seed-admin.ts   # Seeds admin user (admin/admin123)
```

## App Features

### Public Site
- **Home page**: Hero, featured artists, category browse, how it works
- **Browse Artists** (/artists): Filter by category, price, location, availability
- **Artist Profile** (/artists/:id): Portfolio, packages, booking modal
- **Booking Request**: Form with event details, brief, package selection
- **Login** (/login): Artist login page — clean standalone layout

### Artist Dashboard (/dashboard)
- Auth-gated: redirects to /login if not logged in
- Filters bookings to show only the logged-in artist's own bookings
- Availability toggle (available/unavailable)
- Stats: pending requests, completed events, projected earnings
- Accept / Decline / Complete booking actions

### Admin Panel (/admin) — hidden from public nav/footer
- **Dashboard**: Live stats (total artists, bookings, revenue, users)
- **Artists CRUD**: Create/edit/delete artist profiles
- **Bookings**: View and update booking statuses
- **Categories CRUD**: Manage art categories
- **User Accounts** (/admin/users): Create/edit/delete login accounts

## Authentication

- Session-based auth (express-session + bcryptjs)
- Session stored in PostgreSQL (`session` table, auto-created)
- Session cookie: `bma.sid`, 7-day expiry
- Requires `SESSION_SECRET` env var
- Routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Admin can create user accounts and link them to artist profiles
- Admin access: username=`admin` password=`admin123` (seeded)
- Artists log in at `/login`, then see their own dashboard
- Admin panel at `/admin` is NOT linked from public site — direct URL only

## API Endpoints

- `GET /api/auth/me` - get session user
- `POST /api/auth/login` - login
- `POST /api/auth/logout` - logout
- `GET /api/artists` - list/filter artists (params: category, minPrice, maxPrice, location, search, featured, availability)
- `GET /api/artists/:id` - artist profile
- `POST /api/artists` - create artist
- `PUT /api/artists/:id` - update artist
- `DELETE /api/artists/:id` - delete artist
- `GET /api/categories` - art categories
- `POST /api/categories` - create category
- `PUT /api/categories/:id` - update category
- `DELETE /api/categories/:id` - delete category
- `GET /api/bookings` - list bookings (params: artistId, status)
- `POST /api/bookings` - create booking request
- `PATCH /api/bookings/:id/status` - update booking status
- `DELETE /api/bookings/:id` - delete booking
- `GET /api/admin/stats` - platform stats
- `GET /api/admin/users` - list user accounts
- `POST /api/admin/users` - create user account
- `PUT /api/admin/users/:id` - update user account
- `DELETE /api/admin/users/:id` - delete user account

## DB Schema

- `categories` - art categories (music, photography, painting, etc.)
- `artists` - artist profiles with packages, portfolio, availability
- `bookings` - booking requests with status tracking
- `users` - user accounts (admin/artist roles, linked to artist profiles)
- `session` - express-session store (auto-created by connect-pg-simple)

## Design

- **Theme**: Dark mode only
- **Colors**: Primary indigo (#6366f1), accent electric yellow-green
- **Fonts**: Plus Jakarta Sans (headings), Inter (body)
- **Style**: Glassmorphism navbar, gradient text, animated hover effects
- **Admin**: Dark sidebar layout, separate from main site layout

## Commands

- `pnpm --filter @workspace/api-spec run codegen` - regenerate API client
- `pnpm --filter @workspace/db run push` - push DB schema changes
- `pnpm --filter @workspace/scripts run seed` - seed demo data
- `pnpm --filter @workspace/scripts run seed-admin` - create admin user
