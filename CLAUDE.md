# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

## Commands

All commands use pnpm. Run from the repo root unless noted.

```bash
# Install dependencies (all workspaces)
pnpm install

# Run frontend dev server (Vite, port 5173)
pnpm --filter @workspace/bookmeartist dev

# Run API server in dev mode (builds then starts, port 3001)
pnpm --filter @workspace/api-server dev

# Build API server (esbuild → dist/index.mjs)
pnpm --filter @workspace/api-server build

# Start already-built API server
pnpm --filter @workspace/api-server start

# Typecheck everything
pnpm typecheck

# Typecheck a single package
pnpm --filter @workspace/bookmeartist typecheck
pnpm --filter @workspace/api-server typecheck
```

There are no test commands — the project has no test suite.

---

## Architecture

### Monorepo layout

```
artifacts/
  bookmeartist/     React frontend (Vite)
  api-server/       Express API server
  mockup-sandbox/   Throwaway UI prototyping (not production)
lib/
  db/               Drizzle schema + PostgreSQL connection  (@workspace/db)
  api-zod/          Shared Zod validators                  (@workspace/api-zod)
  api-spec/         OpenAPI spec + Orval codegen config
  api-client-react/ Generated typed API client             (@workspace/api-client-react)
```

Packages reference each other as `workspace:*` imports (e.g. `@workspace/db`, `@workspace/api-client-react`). The catalog in `pnpm-workspace.yaml` pins shared dependency versions (React 19, Vite 7, Drizzle 0.45, Zod 3.25, Tailwind 4, etc.).

### Database (`lib/db`)

- Drizzle ORM over `pg` (node-postgres). Connection via `DATABASE_URL` env var.
- Schema files live in `lib/db/src/schema/` — one file per table, all exported from `index.ts`.
- **No drizzle-kit migrations are used.** Every table is created at API server startup via `CREATE TABLE IF NOT EXISTS` SQL blocks in `artifacts/api-server/src/app.ts`. Each table has its own `ensureXxxTable()` async function called at the top of `app.ts` before the Express app is constructed.
- When adding a new table: (1) add a schema file in `lib/db/src/schema/`, (2) export it from `lib/db/src/schema/index.ts`, (3) add an `ensureXxxTable()` function to `app.ts` with the full DDL, including `ALTER TABLE ADD COLUMN IF NOT EXISTS` statements for each column as a defensive migration.

### API server (`artifacts/api-server`)

- Express 5 + pino logging (`req.log`). Entry point: `src/index.ts` → imports `src/app.ts`.
- `app.ts` runs all `ensureXxxTable()` calls as top-level awaits (ES module), then builds and exports the Express app.
- All routes are mounted under `/api` via a single router in `src/routes/index.ts`.
- Route registration order in `routes/index.ts` matters:
  1. Public routes (health, auth, categories, artists, bookings, applications, cms, blog)
  2. `router.use("/admin", requireAdmin)` — locks all subsequent `/admin/*` routes
  3. Admin-specific routers (admin, adminUsers, adminCredentials)
- **Blog routes exception**: `blog.ts` is registered *before* the admin middleware block and includes inline `requireAdmin` on its own admin routes (`GET/POST/PUT/DELETE /admin/blog`).
- Auth is session-based (`express-session` + `connect-pg-simple`, cookie name `bma.sid`). Session stores `userId`, `role`, `artistId`. The `requireAdmin` middleware checks `req.session.role === "admin"`.
- Default admin credentials seeded on first boot: `admin` / `admin123`.
- esbuild bundles the server to `dist/index.mjs` for production. Build config: `build.mjs`.

### Frontend (`artifacts/bookmeartist`)

- React 19 + Vite 7. Router: **Wouter** (not React Router). Data fetching: **TanStack Query**.
- UI: shadcn/ui components (Radix UI primitives + Tailwind CSS v4) in `src/components/ui/`.
- Path alias `@/` resolves to `src/`.
- **API URL**: use `apiUrl(path)` from `@/lib/api-base` — reads `VITE_API_URL` env var. **Never use `import.meta.env.BASE_URL`** (that is Vite's app base path, not the API server URL). In dev, `VITE_API_URL` is unset and Vite proxies `/api` → `http://localhost:3001`.
- **Auth context**: `useAuth()` from `src/contexts/auth-context.tsx` — backed by `@workspace/api-client-react`. Provides `user`, `isAdmin`, `isArtist`, `login`, `logout`.
- **Routing in `App.tsx`**: Admin routes (`/admin/*`) are declared first as top-level `<Route>` elements with `AdminProtectedRoute`. Public routes are nested inside `<Layout>` via `MainRouter`. The `WouterRouter` uses `base={import.meta.env.BASE_URL}`.
- **SEO**: use `<PageSeo>` from `src/components/page-seo.tsx` on every page. Supports `title`, `description`, `canonical`, `type`, `noindex`, and a `schema` prop for JSON-LD structured data.
- **Layouts**: public pages use `<Layout>` (nav + footer). Admin pages use `<AdminLayout>` (left sidebar). Adding a new admin page requires registering it in both `App.tsx` (route) and `src/components/admin-layout.tsx` (sidebar nav item).

### API client (`lib/api-client-react`)

- Generated by Orval from the OpenAPI spec in `lib/api-spec/`. Run `pnpm --filter @workspace/api-spec codegen` to regenerate.
- The `customFetch` in `lib/api-client-react/src/custom-fetch.ts` is the transport for all generated calls — it handles base URL prepending, auth bearer tokens, content-type negotiation, and typed `ApiError` / `ResponseParseError` exceptions.
- The `AuthContext` uses `login`, `logout`, and `getMe` functions from this package directly (not the generated hooks, because auth is managed in context state).

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | `api-server/.env` | PostgreSQL connection string |
| `SESSION_SECRET` | `api-server/.env` | Signs session cookies |
| `PORT` | both | Server port (API: 3001, frontend: 5173) |
| `NODE_ENV` | `api-server/.env` | `development` / `production` |
| `VITE_API_URL` | `bookmeartist/.env` | API server origin in production (e.g. `https://api.bookmeartist.replit.app`) |
| `BASE_PATH` | `bookmeartist/.env` | Vite `base` path (default `/`) |
