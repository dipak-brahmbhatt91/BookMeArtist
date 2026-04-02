# BookMeArtist — Technical Documentation

> **Version:** 1.0  
> **Stack:** TypeScript · Node.js · React · PostgreSQL  
> **Architecture:** Full-stack monorepo (pnpm workspaces)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Admin Panel](#9-admin-panel)
10. [Startup & Seed Data](#10-startup--seed-data)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)
13. [Development Guide](#13-development-guide)

---

## 1. Project Overview

**BookMeArtist** is a full-stack artist marketplace where:

- **Clients** browse a curated roster of verified artists (musicians, photographers, painters, performers), filter by category, price, and location, read detailed profiles with portfolio galleries, and submit booking requests.
- **Artists** log in to a protected dashboard to view their incoming bookings.
- **Admins** manage every entity in the system through a hidden CRM/CMS panel at `/admin` — artists, bookings, categories, users, and artist applications.
- **Anyone** can apply to join the platform as an artist via a public application form on the home page.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Replit Platform                     │
│                                                         │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │   Frontend (Vite)   │   │   API Server (Express)  │  │
│  │   React 18 + SPA    │◄──┤   REST + Session Auth   │  │
│  │   Port: $PORT       │   │   Port: 8080            │  │
│  └─────────────────────┘   └────────────┬────────────┘  │
│                                         │               │
│                             ┌───────────▼─────────────┐ │
│                             │  PostgreSQL (Replit DB)  │ │
│                             │  Drizzle ORM            │ │
│                             └─────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Request flow:**

1. The browser loads the React SPA from the Vite dev server (or the static build in production).
2. All data fetches go to the Express API server at `/api/*`.
3. The API server validates requests (Zod), queries PostgreSQL via Drizzle ORM, and returns JSON.
4. Session state (who is logged in) is stored in the `session` table in PostgreSQL via `connect-pg-simple`.

---

## 3. Monorepo Structure

```
workspace/
├── artifacts/
│   ├── api-server/          # Express REST API
│   │   └── src/
│   │       ├── app.ts       # App factory, startup tasks, session config
│   │       ├── routes/      # All route handlers
│   │       ├── middleware/  # Auth middleware (requireAdmin, requireAuth)
│   │       └── lib/         # Logger, helpers
│   └── bookmeartist/        # React + Vite frontend SPA
│       └── src/
│           ├── App.tsx      # Root component, router setup
│           ├── pages/       # Page-level components
│           ├── components/  # Shared UI components
│           └── hooks/       # Custom hooks
├── lib/
│   ├── db/                  # Drizzle ORM schema + client
│   │   └── src/
│   │       ├── schema/      # One file per table
│   │       └── index.ts     # DB client (pool + db export)
│   ├── api-client-react/    # Auto-generated React Query client
│   │   └── src/
│   │       ├── generated/   # api.ts, api.schemas.ts
│   │       └── custom-fetch.ts
│   └── api-spec/
│       └── openapi.yaml     # OpenAPI 3.0 spec (source of truth)
├── pnpm-workspace.yaml
└── package.json
```

### Package names

| Package | Name |
|---|---|
| API server | `@workspace/api-server` |
| Frontend | `@workspace/bookmeartist` |
| DB | `@workspace/db` |
| API client | `@workspace/api-client-react` |
| API spec | `@workspace/api-spec` |

---

## 4. Technology Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| Language | TypeScript | ~5.9 |
| Web framework | Express | ^5 |
| ORM | Drizzle ORM | catalog |
| Database | PostgreSQL | Replit managed |
| Session store | connect-pg-simple | ^10 |
| Session middleware | express-session | ^1.19 |
| Password hashing | bcryptjs (pure JS) | ^3 |
| Request validation | Zod | catalog |
| Logging | pino + pino-http | ^9 / ^10 |
| Build | esbuild | ^0.27 |

> **Note:** `bcryptjs` (not native `bcrypt`) is used to avoid native addon compilation issues in the Replit environment.

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | ~5.9 |
| UI framework | React | ^18 |
| Build tool | Vite | ^6 |
| Router | Wouter | ^3 |
| Data fetching | TanStack React Query | catalog |
| UI components | shadcn/ui (Radix UI) | various |
| Styling | Tailwind CSS | ^4 |
| Animation | Framer Motion | ^12 |
| Icons | Lucide React | ^0.475 |
| Fonts | Plus Jakarta Sans, Inter (Google Fonts) |  |

---

## 5. Database Schema

All tables are defined in `lib/db/src/schema/` using Drizzle ORM and validated with `drizzle-zod`.

### `categories`

Stores artist category types (e.g. Music, Photography).

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Auto-increment |
| `name` | text | e.g. `"Photography"` |
| `slug` | text UNIQUE | e.g. `"photography"` |
| `icon` | text | Icon identifier string |

---

### `artists`

The core entity. One row per artist profile.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text | Artist display name |
| `bio` | text | Long-form biography |
| `category_id` | integer FK → categories | |
| `location` | text | e.g. `"New York, NY"` |
| `profile_image` | text | URL to profile photo |
| `portfolio_images` | jsonb `string[]` | Array of image URLs |
| `base_price` | numeric(10,2) | Starting price in USD |
| `rating` | numeric(3,2) | e.g. `4.80`. Default `0` |
| `review_count` | integer | Default `0` |
| `featured` | boolean | Shown on home page. Default `false` |
| `tags` | jsonb `string[]` | e.g. `["portrait","editorial"]` |
| `packages` | jsonb `Package[]` | Service packages (see below) |
| `availability` | text enum | `available` / `busy` / `unavailable` |
| `social_links` | jsonb `SocialLinks` | See below |
| `created_at` | timestamp | Auto `now()` |

**Package shape:**
```json
{ "name": "string", "description": "string", "price": number, "duration": "string" }
```

**SocialLinks shape:**
```json
{ "instagram": "string?", "website": "string?", "youtube": "string?", "twitter": "string?", "tiktok": "string?" }
```

---

### `bookings`

Client booking requests submitted via the artist profile page.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `artist_id` | integer FK → artists | |
| `client_name` | text | |
| `client_email` | text | |
| `event_date` | text | ISO date string |
| `event_type` | text | e.g. `"Wedding"` |
| `package_name` | text nullable | Selected package name |
| `budget` | numeric(10,2) | Client's budget |
| `brief` | text | Project description |
| `location` | text | Event location |
| `status` | text enum | `pending` / `accepted` / `declined` / `completed`. Default `pending` |
| `created_at` | timestamp | Auto `now()` |

---

### `users`

Authenticated users — admins and artists.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `username` | text UNIQUE | Login identifier |
| `password_hash` | text | bcrypt hash (cost 12) |
| `role` | text enum | `admin` / `artist` |
| `artist_id` | integer FK → artists nullable | Linked artist profile |
| `created_at` | timestamp | Auto `now()` |

---

### `applications`

Artist join requests submitted via the public application form.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text | Applicant name |
| `email` | text | |
| `specialty` | text | e.g. `"Saxophone"` |
| `location` | text | |
| `bio` | text | |
| `instagram` | text | Social handle |
| `message` | text | Additional notes |
| `status` | text enum | `pending` / `approved` / `rejected`. Default `pending` |
| `created_at` | timestamp | Auto `now()` |

---

### `session`

Managed automatically by `connect-pg-simple`. Stores Express session data.

| Column | Type |
|---|---|
| `sid` | varchar PK |
| `sess` | json |
| `expire` | timestamp |

---

## 6. API Reference

Base path: `/api`

All responses are JSON. Error shape: `{ "error": "string" }`.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Returns `{ status: "ok" }` |

---

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Log in. Body: `{ username, password }`. Returns user object + sets session cookie `bma.sid`. |
| POST | `/api/auth/logout` | None | Destroys session, clears cookie. |
| GET | `/api/auth/me` | Session | Returns current user object or `401`. |

**Session cookie:** `bma.sid` (HttpOnly, Secure in production, SameSite=Lax)

---

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | None | List all categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

---

### Artists

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/artists` | None | List/search artists (see filters below) |
| GET | `/api/artists/:id` | None | Get single artist with `categoryName` |
| POST | `/api/artists` | Admin | Create artist |
| PUT | `/api/artists/:id` | Admin | Update artist |
| DELETE | `/api/artists/:id` | Admin | Delete artist |

**GET /api/artists query params:**

| Param | Type | Description |
|---|---|---|
| `category` | string | Category slug |
| `minPrice` | number | Minimum base price |
| `maxPrice` | number | Maximum base price |
| `location` | string | Partial match (case-insensitive) |
| `search` | string | Searches name, bio, location (ILIKE) |
| `featured` | `"true"` | Only return featured artists |

> `basePrice` and `rating` are coerced to strings before Zod validation on the server, so the API accepts both numeric and string values from clients.

---

### Bookings

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/bookings` | Admin | List all bookings |
| GET | `/api/bookings/my` | Artist session | Get bookings for logged-in artist |
| POST | `/api/bookings` | None | Submit a booking request |
| PUT | `/api/bookings/:id/status` | Admin | Update booking status |

---

### Applications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/applications` | Admin | List all applications |
| POST | `/api/applications` | None | Submit artist application |
| PUT | `/api/applications/:id/status` | Admin | Update status (`pending`/`approved`/`rejected`) |

> `applicationsRouter` is registered **before** the `requireAdmin` middleware so that `POST /api/applications` is publicly accessible.

---

### Admin — Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users` | Admin | Create user (artist or admin) |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |

---

### Admin — Credentials

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/credentials` | Admin | Change admin username/password |

---

## 7. Authentication & Authorization

### Session-based auth

- **Library:** `express-session` with `connect-pg-simple` as the PostgreSQL session store.
- **Cookie name:** `bma.sid`
- **Session data stored:**
  ```typescript
  {
    userId: number;
    role: "admin" | "artist";
    artistId: number | null;
  }
  ```
- **Production:** `app.set("trust proxy", 1)` is set so that the session cookie's `Secure` flag works correctly behind the Replit proxy.

### Middleware

Two middleware guards protect routes:

| Middleware | Check | Applied to |
|---|---|---|
| `requireAuth` | `req.session.userId` exists | Artist dashboard routes |
| `requireAdmin` | `userId` exists AND `role === "admin"` | All `/api/admin/*` routes + artist/category/booking mutations |

### Frontend route guards

| Component | What it does |
|---|---|
| `ProtectedRoute` | Redirects to `/login` if not authenticated |
| `AdminProtectedRoute` | Redirects to `/login` if not authenticated OR `role !== "admin"` |

### Default admin credentials

Auto-seeded on first startup (if no admin user exists):

```
Username: admin
Password: admin123
```

> Change these immediately in production via the Security settings page in the admin panel (`/admin/security`).

---

## 8. Frontend Architecture

### Routing

The frontend uses **Wouter** (lightweight React router). Two nested routers handle path prefix routing for the Replit proxy:

**Public routes (served under app base path):**

| Path | Component | Auth |
|---|---|---|
| `/` | `Home` | Public |
| `/artists` | `BrowseArtists` | Public |
| `/artists/:id` | `ArtistProfile` | Public |
| `/login` | `Login` | Public |
| `/dashboard` | `Dashboard` | Artist session required |

**Admin routes:**

| Path | Component | Auth |
|---|---|---|
| `/admin` | `AdminDashboard` | Admin session required |
| `/admin/artists` | `AdminArtists` | Admin session required |
| `/admin/categories` | `AdminCategories` | Admin session required |
| `/admin/bookings` | `AdminBookings` | Admin session required |
| `/admin/users` | `AdminUsers` | Admin session required |
| `/admin/applications` | `AdminApplications` | Admin session required |
| `/admin/security` | `AdminSecurity` | Admin session required |

### State management

- **Server state:** TanStack React Query (via `@workspace/api-client-react`) handles all data fetching, caching, and mutation.
- **Session state:** A React context (`AuthContext`) wraps the app and exposes `user`, `login()`, and `logout()` from the `/api/auth/me` endpoint.
- **Local UI state:** Plain `useState` for forms, modals, and filter controls.

### API client

`@workspace/api-client-react` is a generated client that wraps every API endpoint in typed React Query hooks. Key exports:

```typescript
useListArtists(params)        // GET /api/artists
useGetArtist(id)              // GET /api/artists/:id
useCreateArtist()             // POST /api/artists
useUpdateArtist()             // PUT /api/artists/:id
useDeleteArtist()             // DELETE /api/artists/:id
useListBookings()             // GET /api/bookings
useCreateBooking()            // POST /api/bookings
useListCategories()           // GET /api/categories
useListApplications()         // GET /api/applications
// ... etc
```

All hooks use a shared `customFetch` that prepends `import.meta.env.BASE_URL` to every request path so the app works under any base path prefix.

### Key pages

#### Home (`/`)
- Hero section with live search bar that navigates to `/artists?search=<query>` on submit or Enter keypress.
- Category grid linking to `/artists?category=<slug>`.
- Featured artists carousel.
- "Apply as Artist" modal (POSTs to `/api/applications`).

#### Browse Artists (`/artists`)
- Initializes search state from `?search=` URL param on mount.
- Live debounced search (400ms) against the API.
- Price range slider filter.
- Category badge filters.

#### Artist Profile (`/artists/:id`)
- Full bio, packages, availability badge.
- Portfolio lightbox gallery (click to open, arrow navigation, keyboard support, image counter, thumbnail strip).
- Smart social link URL construction (handles handles with/without `@` or `http`).
- Inline booking modal that POSTs to `/api/bookings`.

#### Dashboard (`/dashboard`)
- Protected — requires active artist session.
- Shows the logged-in artist's bookings with status badges.

---

## 9. Admin Panel

Located at `/admin` — **not linked anywhere in the public UI**.

All admin routes require an active admin session (`role === "admin"`). Un-authenticated requests are redirected to `/login`.

### Sections

| Section | Path | Features |
|---|---|---|
| Dashboard | `/admin` | Summary stats, recent bookings |
| Artists | `/admin/artists` | Full CRUD; portfolio image management (add/remove/thumbnail grid); profile image with preview; social links (Instagram, Website, YouTube, Twitter, TikTok); packages with duration; rating + review count; availability toggle |
| Categories | `/admin/categories` | Add/edit/delete categories |
| Bookings | `/admin/bookings` | View all bookings, update status (pending/accepted/declined/completed) |
| Users | `/admin/users` | Create artist or admin accounts, link users to artist profiles, delete users |
| Applications | `/admin/applications` | Review artist applications, approve or reject |
| Security | `/admin/security` | Change admin username and password |

---

## 10. Startup & Seed Data

On every server start, `app.ts` runs four sequential setup functions before listening:

```
ensureSessionTable()     → Creates the `session` table if not present
ensureApplicationsTable() → Creates the `applications` table if not present
ensureSeedData()         → Seeds categories, artists, bookings, and applications
                           (only runs if categories table is empty)
ensureAdminUser()        → Creates the default admin user if no admin exists
```

### Seed data contents

- **6 categories:** Music & Bands, Photography, Visual Arts, Performance Arts, DJ & Electronic, Comedy & Entertainment
- **13 artists** spread across all categories with realistic bios, packages, tags, social links, and portfolio images
- **17 bookings** in various statuses (pending, accepted, declined, completed)
- **5 artist applications** in various statuses

---

## 11. Deployment

The app is deployed on **Replit** with two separate long-running services managed by Replit Workflows:

| Workflow | Command | Description |
|---|---|---|
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | Express API on port 8080 |
| `artifacts/bookmeartist: web` | `pnpm --filter @workspace/bookmeartist run dev` | Vite dev server (or build output) |

Replit's proxy layer routes all requests through a single HTTPS domain, directing traffic to the correct service by path.

**Production considerations:**
- `SESSION_SECRET` must be set as an environment secret (not hardcoded). The app reads it from `process.env.SESSION_SECRET`.
- `app.set("trust proxy", 1)` is configured to ensure `Secure` cookies work behind Replit's TLS proxy.
- `req.session.save()` is explicitly called after login to guarantee the session is persisted before the response is sent.

---

## 12. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (provided automatically by Replit) |
| `SESSION_SECRET` | Yes | Secret key for signing session cookies. Set via Replit Secrets. |
| `PORT` | Auto | Port for the Vite frontend server (set automatically by Replit) |
| `NODE_ENV` | Auto | `development` in dev, `production` after publishing |

---

## 13. Development Guide

### Prerequisites

- Node.js 20+
- pnpm 9+

### Running locally

```bash
# Install dependencies
pnpm install

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (in a separate terminal)
pnpm --filter @workspace/bookmeartist run dev
```

### Database changes

Schema files live in `lib/db/src/schema/`. After editing a schema:

```bash
pnpm --filter @workspace/db run db:push
```

This uses `drizzle-kit push` to apply schema changes directly to the database without writing migration files.

### Regenerating the API client

The API client in `lib/api-client-react/src/generated/` is generated from `lib/api-spec/openapi.yaml`.

After updating `openapi.yaml`, manually update the corresponding TypeScript types in:
- `lib/api-client-react/src/generated/api.schemas.ts` (interfaces and types)
- `lib/api-client-react/src/generated/api.ts` (fetch functions and React Query hooks)

### Key conventions

| Convention | Detail |
|---|---|
| Zod import in DB schema | `from "zod/v4"` |
| Zod import in API server | `from "zod"` |
| Numeric Drizzle columns | Validated as `z.string()` by drizzle-zod; coerce with `String()` before validation |
| Password hashing | bcryptjs with cost factor `12` |
| Session cookie | `bma.sid` |
| Artist profile URL | `/artists/:id` (NOT `/artist/:id`) |
| Admin route guard order | `applicationsRouter` registered BEFORE `requireAdmin` middleware |
| Base URL | All API calls prepend `import.meta.env.BASE_URL` via `customFetch` |

---

*Generated for BookMeArtist v1.0 — March 2026*
