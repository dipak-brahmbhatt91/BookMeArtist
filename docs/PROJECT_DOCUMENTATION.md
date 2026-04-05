# BookMeArtist Project Documentation

## Purpose

This document is the single end-to-end reference for the BookMeArtist application.

It combines:

- product overview
- business model
- user roles
- end-to-end user flows
- current feature inventory
- technical architecture
- data model overview
- deployment and environment notes

Use this document when you want one complete picture of what the project does, how users move through it, and how the application is built.

Related documents:

- `docs/APPLICATION_FLOW.md` for detailed business and operational flow
- `docs/TECHNICAL.md` for deeper engineering detail
- `docs/SETUP.md` for local setup and hosting guidance

---

## 1. Project Overview

BookMeArtist is a curated artist booking marketplace.

It helps three groups work together:

- visitors and clients discover artists and send booking inquiries
- artists manage a public profile and incoming leads from a protected workspace
- admins control the marketplace, review artist intake, manage content, and link user accounts to artist profiles

The platform is intentionally admin-led.

That means:

- artist profiles can be created manually by admin
- new artist applications are manually reviewed
- public profile claim requests are manually reviewed
- artist accounts are linked to artist profiles by admin

This reduces false claims and keeps the marketplace curated during the MVP stage.

---

## 2. Business Model and Operating Style

BookMeArtist currently works as:

- a public artist discovery platform
- a lead-generation and booking request system
- an admin-controlled onboarding pipeline
- an artist workspace for profile and booking operations
- a lightweight CMS-managed marketing site

It is not yet a full transactional marketplace.

Not yet included in the current product:

- online checkout or payments
- contracts or proposals
- built-in chat or messaging
- payouts
- automated artist approval
- automated claim verification
- calendar sync
- notification center

---

## 3. User Roles

### 3.1 Visitor / Client

Visitors can:

- view the homepage and CMS-driven marketing content
- browse and filter artist listings
- open public artist profile pages
- submit booking requests
- submit a new artist application
- submit a request to claim an existing artist profile

Visitors do not need an account for these actions.

### 3.2 Artist

Artists can:

- log in with a linked artist account
- access the protected workspace at `/dashboard`
- review booking pipeline metrics
- accept, decline, and complete booking requests
- edit their public profile details
- update packages, pricing, portfolio media, tags, social links, and availability

An artist account is only useful after admin links it to an artist profile.

### 3.3 Admin

Admins can:

- access the admin control area
- manage categories, artists, bookings, users, and content
- review new artist applications
- review profile claim requests
- create draft artist profiles from approved applications
- manually create and link artist user accounts
- update admin credentials

Admins are the operational control center of the marketplace.

---

## 4. Core Product Areas

The application has four major surfaces:

### 4.1 Public Site

Used for:

- marketing
- artist discovery
- profile browsing
- booking inquiry submission
- artist application intake

Main routes:

- `/`
- `/artists`
- `/artists/:id`
- `/claim-profile`
- `/login`

### 4.2 Artist Workspace

Used for:

- artist overview metrics
- booking pipeline handling
- public profile management

Main route:

- `/dashboard`

### 4.3 Admin Panel

Used for:

- marketplace operations
- curation
- review workflows
- data management
- CMS management

Main routes:

- `/admin`
- `/admin/artists`
- `/admin/categories`
- `/admin/bookings`
- `/admin/users`
- `/admin/applications`
- `/admin/security`
- `/admin/content`

### 4.4 Backend API

Used for:

- data access
- validation
- authentication
- session management
- authorization
- business workflow enforcement

Main prefix:

- `/api/*`

---

## 5. Current Feature Inventory

### 5.1 Public Features

Homepage:

- CMS-driven hero content
- site info and positioning content
- trusted-by section
- how-it-works section
- featured artist display
- search call-to-action
- category discovery
- artist application entry point

Artist discovery:

- browse all artists
- search by text
- filter by category
- filter by location
- filter by price or budget range
- view featured artists

Artist profile page:

- artist-specific SEO title and meta data
- public profile hero and image
- category, location, biography, and tags
- rating and review count
- portfolio gallery
- service packages
- social links
- availability status
- booking request entry point
- profile claim entry point

Booking request:

- client name
- client email
- event date
- event type
- package selection
- budget
- event location
- project brief

### 5.2 Artist Intake Features

Apply as Artist:

- homepage modal form
- collects applicant name, email, specialty, category, location, bio, Instagram, and message
- creates a `new_artist` application record

Claim Profile:

- public claim request page
- launched from an existing public artist profile
- collects claimant name, email, Instagram, and supporting note
- creates a `claim_profile` application record
- requires manual admin review before any account is linked

### 5.3 Artist Workspace Features

Overview tab:

- pending bookings metric
- confirmed bookings metric
- completed bookings metric
- projected earnings metric
- upcoming activity feed
- profile completion guidance
- quick actions

Bookings tab:

- list artist-owned bookings only
- filter by status
- review booking details
- accept booking
- decline booking
- mark booking completed

Profile tab:

- edit artist name
- edit bio
- edit category
- edit location
- edit base price
- edit availability
- edit profile image
- add and remove portfolio images
- manage tags
- manage social links
- create, update, and remove service packages
- open public profile preview

### 5.4 Admin Features

Admin dashboard:

- high-level stats
- recent booking activity
- quick links into common admin actions

Category management:

- create categories
- update categories
- delete categories

Artist management:

- create artist profiles manually
- update artist details
- update pricing and availability
- update media and packages
- delete artist profiles

Bookings management:

- view all bookings
- filter bookings by status
- inspect details
- update status
- delete bookings

Applications management:

- review `new_artist` applications
- review `claim_profile` requests
- approve or reject requests
- create artist draft profiles from approved new artist applications
- see linked and claimed artist references
- hand off approved records into manual user-account linking

User management:

- create admin users
- create artist users
- link artist users to artist profiles
- update users
- delete users

Security management:

- update admin username
- update admin password

CMS management:

- edit homepage hero content
- edit trusted-by content
- edit how-it-works content
- edit artist CTA content
- edit general site information

### 5.5 Platform and Operational Features

Authentication:

- session-based login
- logout
- current-user lookup

Authorization:

- admin-only route protection
- authenticated route protection
- artist ownership checks for profile editing
- artist ownership checks for booking access and status changes

Bootstrap and seed behavior:

- create required tables on startup
- ensure session table exists
- ensure default admin exists
- seed categories
- seed artists
- seed bookings
- seed CMS content

Deployment readiness:

- split frontend and backend deployment support
- configurable frontend API base URL
- shared credentialed fetch behavior
- SPA route rewrite support for static hosting
- production cookie configuration for cross-subdomain deployments

---

## 6. End-to-End User Flows

### 6.1 Visitor Discovery and Booking Flow

1. Visitor lands on `/`.
2. Homepage loads CMS-driven marketing content and featured artists.
3. Visitor searches or navigates to `/artists`.
4. Visitor filters artists by category, location, or budget.
5. Visitor opens `/artists/:id`.
6. Visitor reviews the artist profile, media, packages, and availability.
7. Visitor submits a booking request.
8. The booking is stored and becomes visible to admin and, when linked, to the artist workspace.

### 6.2 New Artist Application Flow

1. Prospect opens the homepage.
2. Prospect clicks `Apply as Artist`.
3. Prospect submits the application form.
4. Backend stores the request as a `new_artist` application.
5. Admin reviews the application in `/admin/applications`.
6. Admin approves the application and creates a draft artist profile.
7. Admin creates a user account and links it to that artist profile.
8. Artist logs in and starts managing the workspace.

### 6.3 Existing Profile Claim Flow

1. Artist opens their public profile page.
2. Artist clicks the claim entry point.
3. Artist submits a claim request.
4. Backend stores the request as a `claim_profile` application.
5. Admin reviews the request in `/admin/applications`.
6. Admin approves or rejects the request.
7. If approved, admin creates or links a user account to the claimed artist profile.
8. Artist logs in and manages the now-linked profile.

### 6.4 Artist Workspace Flow

1. Artist logs in at `/login`.
2. Artist is routed into `/dashboard`.
3. Artist sees overview metrics and quick actions.
4. Artist reviews bookings in the bookings tab.
5. Artist accepts, declines, or completes bookings.
6. Artist edits profile content in the profile tab.
7. Public profile changes become visible on the marketplace listing and artist detail page.

### 6.5 Admin Operations Flow

1. Admin logs in.
2. Admin opens `/admin`.
3. Admin reviews key activity from the dashboard.
4. Admin manages categories, artists, bookings, users, and content.
5. Admin reviews applications and claim requests.
6. Admin creates draft artist profiles when needed.
7. Admin creates and links accounts for approved artists.
8. Admin maintains homepage and marketing content through CMS screens.

---

## 7. Technical Architecture

### 7.1 Architecture Summary

BookMeArtist is a full-stack TypeScript monorepo with:

- a React + Vite SPA frontend
- an Express API server
- a PostgreSQL database
- shared workspace libraries for schema, validation, and client generation

High-level request flow:

1. Browser loads the frontend SPA.
2. Frontend requests data from the API under `/api/*`.
3. API validates input and checks session state.
4. API reads and writes PostgreSQL through Drizzle ORM.
5. JSON responses are returned to the frontend.

### 7.2 Frontend Stack

Frontend package:

- `artifacts/bookmeartist`

Main frontend tools:

- React
- Vite
- Wouter
- TanStack Query
- Tailwind CSS
- Radix UI
- Framer Motion
- React Helmet Async

Frontend responsibilities:

- route rendering
- public pages
- artist workspace
- admin interface
- data fetching and mutations
- SEO metadata

### 7.3 Backend Stack

Backend package:

- `artifacts/api-server`

Main backend tools:

- Node.js
- Express
- Drizzle ORM
- PostgreSQL
- Zod
- express-session
- connect-pg-simple
- Pino
- bcryptjs

Backend responsibilities:

- expose REST endpoints under `/api`
- validate requests
- enforce role and ownership access rules
- manage session authentication
- handle startup bootstrap and seed behavior
- manage business workflows for artists, bookings, applications, and content

### 7.4 Shared Libraries

Shared workspace packages:

- `lib/db` for database client and schema
- `lib/api-spec` for OpenAPI source
- `lib/api-zod` for generated request and response schemas
- `lib/api-client-react` for generated React Query hooks and shared fetch behavior

---

## 8. Frontend Structure and Route Map

Key frontend pages:

- `/` homepage
- `/artists` artist directory
- `/artists/:id` artist details
- `/login` authentication
- `/claim-profile` public claim request flow
- `/dashboard` artist workspace

Admin pages:

- `/admin`
- `/admin/artists`
- `/admin/categories`
- `/admin/bookings`
- `/admin/users`
- `/admin/applications`
- `/admin/security`
- `/admin/content`

Frontend data access behavior:

- generated React Query hooks are used for most API operations
- custom fetch calls are used for a few admin and application flows
- frontend bootstraps the API base URL from `VITE_API_URL`
- shared client fetches include `credentials: "include"` so sessions work across split frontend/backend hosting

Important SPA hosting note:

- static hosts must rewrite unknown routes to `index.html`
- without a rewrite rule, deep links like `/admin` or `/artists/1` return `Not Found`

---

## 9. Backend Route Groups and Access Model

Main route groups:

- `/api/healthz`
- `/api/auth/*`
- `/api/categories`
- `/api/artists`
- `/api/bookings`
- `/api/applications`
- `/api/cms`
- `/api/admin/*`

Access model:

- public endpoints support browsing, CMS reads, booking creation, and application submission
- authenticated endpoints support current-user access and artist workspace actions
- admin endpoints support marketplace operations and review flows

Protection model:

- `requireAuth` protects logged-in flows
- `requireAdmin` protects admin-only flows
- artist-owned profile and booking actions are limited to the linked `artistId` on the session

---

## 10. Database and Data Model

The system uses PostgreSQL with Drizzle ORM.

Core tables:

- `categories`
- `artists`
- `users`
- `bookings`
- `applications`
- `site_content`
- `session`

### 10.1 Categories

Used for:

- marketplace classification
- artist browsing filters
- artist profile categorization
- application categorization

### 10.2 Artists

Stores:

- name
- bio
- category
- location
- profile image
- portfolio images
- base price
- rating
- review count
- featured flag
- tags
- service packages
- availability
- social links

### 10.3 Users

Stores:

- username
- password hash
- role
- linked artist profile ID

Roles in practice:

- `admin`
- `artist`

### 10.4 Bookings

Stores:

- target artist
- client identity
- event date
- event type
- package choice
- budget
- location
- brief
- status

### 10.5 Applications

Stores:

- applicant details
- category reference
- claim reference to existing artist when relevant
- linked artist draft reference when created
- application status
- application type

Application types:

- `new_artist`
- `claim_profile`

Statuses:

- `pending`
- `approved`
- `rejected`

### 10.6 Site Content

Stores editable CMS content for:

- site information
- homepage hero
- trusted-by strip
- how-it-works section
- artist CTA section

### 10.7 Session

Stores server-side session data in PostgreSQL for:

- logged-in user identity
- role
- linked artist access context

---

## 11. Authentication, Sessions, and Security

Current security model includes:

- password hashing with bcrypt
- session-based authentication
- server-side session storage in PostgreSQL
- admin route protection
- artist ownership checks
- secure cookies in production

Split-hosting behavior:

- frontend and backend can run on different domains or subdomains
- production cookies are configured for secure cross-site requests
- frontend requests include credentials so authenticated admin and artist actions succeed

Operational caution:

- the seeded default admin account should be changed immediately after first deployment

---

## 12. Monorepo Structure

Top-level structure:

- `artifacts/api-server` backend application
- `artifacts/bookmeartist` frontend application
- `lib/db` schema and database client
- `lib/api-client-react` generated API client hooks
- `lib/api-zod` generated validation schemas
- `lib/api-spec` API specification source
- `scripts` seed and support scripts
- `docs` project documentation

The repository uses `pnpm` workspaces so apps and shared libraries can evolve together.

---

## 13. Deployment Shape

The project is designed for a split deployment model:

- static frontend
- long-running backend service
- PostgreSQL database

Current recommended deployment shape:

- frontend on Render Static Site
- backend on Render Web Service
- database on Neon

Important production notes:

- frontend must point to the API using `VITE_API_URL`
- static hosting must rewrite routes to `index.html`
- backend session cookies must be secure in production
- cross-origin or cross-subdomain deployments require credentialed frontend requests

Recommended custom-domain structure:

- `yourdomain.com` for the frontend
- `api.yourdomain.com` for the backend

---

## 14. Environment Variables

### Backend

Required:

- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV`
- `PORT`

### Frontend

Used in development or split hosting:

- `VITE_API_URL`
- `PORT`
- `BASE_PATH` when needed by the hosting setup

---

## 15. Current Strengths

The application already has a strong MVP foundation:

- curated marketplace positioning
- complete public discovery flow
- real booking request capture
- admin-led artist onboarding pipeline
- manual claim review process
- working artist workspace
- CMS-managed marketing content
- shared monorepo architecture
- deployment-ready split frontend/backend setup

This is enough to operate as a real early-stage curated booking business.

---

## 16. Current Limitations and Next Logical Enhancements

Current limitations:

- no payments
- no payouts
- no contracts
- no in-platform messaging
- no review submission workflow
- no automated notifications
- no calendar integrations
- no self-serve artist approval

Logical next-stage improvements:

- inquiry-to-booking conversation tools
- payment and deposit handling
- proposal or contract workflow
- richer artist analytics
- notifications by email or SMS
- calendar availability sync
- stronger verification and moderation workflows

---

## 17. Mental Model

The easiest way to understand BookMeArtist is:

- `Public side` handles marketing, discovery, booking inquiries, applications, and claims
- `Artist side` handles profile management and booking operations
- `Admin side` handles curation, approvals, linking, and content operations
- `Backend` handles API rules, sessions, validation, and business logic
- `Database` is the source of truth for artists, bookings, users, applications, content, and sessions

That is the current end-to-end shape of the BookMeArtist project.
