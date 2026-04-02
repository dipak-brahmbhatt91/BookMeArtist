# BookMeArtist Application Flow

## Purpose

This document explains how the BookMeArtist application works end to end from a business and product-flow perspective.

Use this document when you need to understand:

- how a visitor discovers and books an artist
- how a new artist gets onboarded
- how an existing public profile is claimed
- how artists work inside the platform after login
- how admins operate the marketplace day to day

This is a flow document, not a low-level technical reference. For architecture and schema details, see `docs/TECHNICAL.md`.

---

## 1. Core Business Model

BookMeArtist is a curated artist marketplace with three main roles:

- `Client / Visitor`: browses artists and submits booking requests
- `Artist`: manages a linked artist profile and handles bookings in a protected workspace
- `Admin`: controls the directory, applications, users, CMS content, and marketplace operations

The platform is intentionally admin-led:

- artist profiles can be created manually by admins
- artist account access is created manually by admins
- profile claims are manually reviewed
- public artist applications are manually reviewed

This makes the current product safer for a curated marketplace than fully automatic self-signup.

---

## 2. High-Level Lifecycle

The application operates through five main flows:

1. `Discovery`: visitors land on the homepage, browse artists, and open artist profile pages
2. `Booking`: visitors submit booking requests from public artist profiles
3. `Artist onboarding`: artists apply through the homepage, then admins review and create draft profiles and login access
4. `Profile claim`: artists request review to claim an already published profile, then admins approve and create linked login access
5. `Artist operations`: logged-in artists manage profile details, availability, portfolio, packages, and booking statuses inside the workspace

---

## 3. Public Experience

### 3.1 Homepage

Route:

- `/`

What the homepage does:

- loads CMS-driven marketing content from `/api/cms`
- shows featured artists
- supports search that routes users to `/artists`
- shows the `Apply as Artist` modal

Important business behavior:

- homepage copy is partly editable by admin through the CMS screen
- the homepage is both a marketing page and the public entry point for artist applications

### 3.2 Browse Artists

Route:

- `/artists`

What users do here:

- search artists by name or keyword
- filter by category, price, and location
- compare public artist cards

Data source:

- `GET /api/artists`

### 3.3 Artist Profile

Route:

- `/artists/:id`

What users see:

- bio
- category
- location
- portfolio images
- pricing
- packages
- availability
- social links

What users can do:

- submit a booking request
- request profile claim review if they are the real artist behind that profile

Data source:

- `GET /api/artists/:id`

---

## 4. Booking Flow

### 4.1 Client submits a booking request

Entry point:

- booking modal on the public artist profile page

Route and API:

- frontend uses the booking modal component
- backend creates the request through `POST /api/bookings`

Information collected:

- client name
- client email
- event date
- event type
- requested package, if any
- estimated budget
- location
- project brief

Status at creation:

- every new booking starts as `pending`

Important business note:

- clients do not need to create an account to submit a booking
- booking submission is intentionally lightweight to reduce friction

### 4.2 What happens after booking submission

The booking becomes visible to:

- the linked artist in their workspace
- admins in the admin dashboard and bookings management screens

Possible status transitions:

- `pending` -> `accepted`
- `pending` -> `declined`
- `accepted` -> `completed`

Current platform behavior:

- there is no built-in payment, contract, or messaging flow yet
- the booking object currently acts as the lead pipeline and project-status tracker

---

## 5. New Artist Onboarding Flow

This is the standard route for artists who are not yet in the directory.

### 5.1 Artist applies from the homepage

Entry point:

- `Apply as Artist` modal on `/`

Backend endpoint:

- `POST /api/applications`

Application type:

- `new_artist`

Information collected:

- name
- email
- specialty
- category
- location
- bio
- instagram
- optional message

### 5.2 Admin reviews the application

Admin route:

- `/admin/applications`

What admin sees:

- applicant identity
- type of request
- specialty and location
- bio
- instagram
- optional message
- current review status

Possible outcomes:

- `pending` -> `approved`
- `pending` -> `rejected`

### 5.3 Admin creates a draft artist profile

For `new_artist` applications, admin can run:

- `Approve & Create Profile`

Backend endpoint:

- `POST /api/admin/applications/:id/create-artist-draft`

What this does:

- creates a real artist profile in the artists table
- pre-fills that profile from the application
- links the application to the new artist profile
- marks the application as approved

### 5.4 Admin creates login access

After the draft artist profile exists, the next step is:

- open `/admin/users`
- create a user account
- assign role `artist`
- link that user to the new artist profile

Important business rule:

- an artist only gets a useful workspace if their login is linked to an artist profile
- a standalone artist login without a linked profile cannot manage marketplace data

### 5.5 Artist logs in

Route:

- `/login`

Post-login behavior:

- admins go to `/admin`
- artists go to `/dashboard`

---

## 6. Existing Profile Claim Flow

This is the flow for artists who already have a public profile on the site but do not yet have account access.

### 6.1 Artist starts from the public profile

Entry point:

- claim link on `/artists/:id`

Route:

- `/claim-profile`

The claim page is pre-filled with context from the selected public profile.

### 6.2 Artist submits a claim request

Backend endpoint:

- `POST /api/applications/claim`

Application type:

- `claim_profile`

Information collected:

- claimant name
- email
- instagram
- optional verification notes
- claimed artist profile ID

Important business rule:

- this does not instantly create an account
- this does not instantly link the artist profile
- every claim is manually reviewed

### 6.3 Admin reviews the claim

Admin route:

- `/admin/applications`

Admin options:

- approve
- reject

If approved:

- the claimed artist profile remains the source of truth
- admin then creates a linked user account in `/admin/users`

### 6.4 Admin creates login access for the claimed profile

After approval:

- admin opens user setup
- creates the user account
- links role `artist` to the claimed artist profile

This completes the claim flow.

---

## 7. Artist Workspace Flow

Route:

- `/dashboard`

Access:

- authenticated users only
- intended for artist users

If the artist account is not linked to a profile:

- the workspace shows a `No Artist Profile Linked` state
- admin intervention is required in `/admin/users`

### 7.1 Workspace structure

The artist workspace now has three functional areas:

- `Overview`
- `Bookings`
- `Profile`

### 7.2 Overview tab

Purpose:

- give the artist a business snapshot

What it shows:

- pending requests
- confirmed events
- completed events
- projected earnings
- profile completion checklist
- upcoming activity
- quick links into bookings and profile editing

Why this matters:

- this turns the workspace into an operational dashboard, not just a placeholder

### 7.3 Bookings tab

Purpose:

- manage incoming and active booking requests

What the artist can do:

- filter bookings by status
- review each booking brief
- accept a pending booking
- decline a pending booking
- mark an accepted booking as completed

Security model:

- artists can only access bookings that belong to their linked artist profile
- admins can view all bookings

### 7.4 Profile tab

Purpose:

- let artists manage their public selling page

Editable fields include:

- artist name
- category
- location
- bio
- starting price
- availability
- specialties or tags
- profile image
- portfolio images
- social and contact links
- service packages

Business impact:

- this is the core seller-conversion surface
- the public profile is where discovery turns into enquiries

### 7.5 Availability model

Current artist availability states:

- `available`
- `busy`
- `unavailable`

Where it matters:

- public profile visibility and trust
- internal artist workspace controls
- admin artist management

---

## 8. Admin Operating Flow

Admin routes are protected under `/admin`.

### 8.1 Admin Dashboard

Route:

- `/admin`

Purpose:

- top-level marketplace summary

What it covers:

- artist counts
- booking counts
- recent booking activity
- quick access to management screens

### 8.2 Categories Management

Route:

- `/admin/categories`

Purpose:

- manage the artist taxonomy used across browse, artist profiles, and applications

### 8.3 Artists Management

Route:

- `/admin/artists`

Purpose:

- create, edit, and delete artist profiles directly

Typical use cases:

- manually creating artist profiles
- cleaning up public-facing data
- editing featured status
- adjusting portfolio, pricing, and availability

### 8.4 Bookings Management

Route:

- `/admin/bookings`

Purpose:

- oversee all booking requests across the marketplace

Admin abilities:

- review all bookings
- inspect details
- update statuses
- delete bookings if necessary

### 8.5 Applications Management

Route:

- `/admin/applications`

Purpose:

- operate both artist onboarding paths

This screen handles:

- new artist applications
- profile claim requests
- approval and rejection
- draft profile creation for new artists
- handoff to user-account creation

### 8.6 User Accounts Management

Route:

- `/admin/users`

Purpose:

- manage admin and artist login accounts

Most important responsibility:

- linking artist users to artist profiles

Without that link:

- the artist cannot manage the correct bookings or profile

### 8.7 Admin Security

Route:

- `/admin/security`

Purpose:

- manage admin login credentials such as username and password

### 8.8 Admin Content Management

Route:

- `/admin/content`

Purpose:

- edit public marketing content without code changes

Content areas include:

- site info
- homepage hero section
- trusted-by content
- how-it-works steps
- artist CTA section

This means product messaging can be updated operationally by admin.

---

## 9. Authentication and Authorization Flow

### 9.1 Login

Backend endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Session model:

- login creates a server-side session
- the session stores `userId`, `role`, and `artistId`

### 9.2 Role behavior

`admin`:

- can access all admin routes
- can manage all artists, bookings, applications, users, and CMS content

`artist`:

- can access the workspace
- can only manage their own linked profile and bookings

### 9.3 Ownership enforcement

Protected behavior already in place:

- artists cannot update other artists' profiles
- artists cannot view other artists' bookings
- artists cannot update or delete other artists' bookings

This is one of the most important controls in the current app.

---

## 10. Data Lifecycle Summary

### Artist record lifecycle

An artist profile can be created in two main ways:

1. directly by admin in `/admin/artists`
2. from a `new_artist` application via draft creation in `/admin/applications`

After that, the profile may later be:

- claimed by the real artist through manual review
- linked to a login account by admin
- updated by the linked artist in the workspace

### Booking lifecycle

`pending` -> `accepted` -> `completed`

or

`pending` -> `declined`

### Application lifecycle

`pending` -> `approved`

or

`pending` -> `rejected`

Application subtypes:

- `new_artist`
- `claim_profile`

---

## 11. Current End-to-End Operating Model

If you are running the platform as a business today, the standard operating process is:

1. admin curates categories and public site content
2. admin manually creates artist profiles or receives artist applications
3. visitors browse artists and submit booking requests
4. artists request onboarding either through application or claim review
5. admin approves, creates or confirms the artist profile, then creates linked login access
6. artist logs in and manages their profile and bookings in the workspace
7. admin continues overseeing bookings, applications, users, and content

This is the current real business workflow of the app.

---

## 12. Important Product Constraints Right Now

The platform currently does not include:

- automated artist self-registration with instant approval
- automated profile claiming
- in-app messaging between artist and client
- contracts
- payments
- calendar sync
- payout management

So the product should be understood as:

- a curated discovery marketplace
- a lead and booking request system
- an admin-controlled artist onboarding platform
- an artist workspace for profile and booking operations

---

## 13. Recommended Mental Model

The easiest way to understand BookMeArtist is:

- `public side` = discovery and lead capture
- `admin side` = marketplace control center
- `artist workspace` = seller operations panel

That mental model matches how the current codebase and business flow actually work today.
