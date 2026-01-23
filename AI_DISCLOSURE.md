# AI_DISCLOSURE.md

## Project: Café Fausse (React + Flask + PostgreSQL)

This document describes how AI-assisted code generation was used during the development of the Café Fausse web application, and how the generated outputs were verified and integrated into the final solution.

---

## 1) AI Tools Used

- **ChatGPT (OpenAI)** — used as an assistant for:
  - generating and refining React + Flask implementation drafts,
  - producing component code and API wiring patterns,
  - implementing and iterating on reservation slot logic and guardrails,
  - creating/adjusting CSS rules for the dark “premium” UI theme,
  - debugging compile/runtime issues based on logs/screenshots provided by the developer.

AI did **not** run the project in the developer’s environment. All integration, builds, and runtime testing were performed locally by the developer.

> Note: Some code packaging / file bundles were prepared in an assistant sandbox to deliver updated files faster; this is not the same as executing the project in the target environment.

---

## 2) What Was Created or Modified With AI Help

### 2.1 Frontend (React)
AI assistance was used to draft and refine:
- A multi-page React app with navigation and routing (at least):
  - `Home`, `Menu`, `Reservations`, `About`, `Gallery`
- Shared layout components (where present):
  - `Navbar`, `Footer`, `Hero`
- API helper wiring for frontend-to-backend communication:
  - `api.js` helper patterns for JSON requests
- UI behavior and interaction refinements:
  - **Gallery thumbnails + Lightbox** behavior (open/close, navigation, selected index handling)
  - Rendering additional Gallery sections such as **Awards** and **Reviews** from the gallery data module (where included in the project)
- Reservations UI logic:
  - **Time selection in 30-minute slots**
  - Reservation duration enforced as **60 minutes**
  - Display of **opening hours for the selected day**
  - Availability preview messaging

#### Important implementation detail (state of the project)
Because native HTML `<select>` option menus are not reliably stylable on Windows/Chrome, the time picker was implemented as a **custom dropdown** (button + menu) to ensure a consistent black/dark dropdown background across platforms.

### 2.2 Styling (CSS)
AI help was used to:
- build a cohesive dark theme with consistent spacing and component styling,
- apply **Flexbox / CSS Grid** layouts for responsive UX:
  - two-column layouts for key pages,
  - gallery grids with responsive breakpoints,
- improve gallery visuals (thumbnail sizing, object-fit, hover behavior),
- troubleshoot and iterate on dark-theme form controls:
  - calendar/time input appearance,
  - ensuring the time dropdown matches the dark theme (via the custom dropdown approach).

### 2.3 Backend (Flask + Database)
AI assistance was used to draft and refine:
- Flask API routes for core functionality:
  - **Reservations** endpoint that accepts:
    - a datetime **start slot**,
    - number of guests,
    - name,
    - required email,
    - optional phone
  - Availability logic to:
    - reject reservations **outside opening hours**,
    - enforce **30-minute slot alignment** (HH:00 / HH:30),
    - enforce **60-minute reservation duration**,
    - allocate a table number from a finite pool,
    - reject a reservation if the slot is **fully occupied** (no tables available for the requested time window).
  - An **availability check endpoint** (where included) used by the UI to preview whether a given slot is available.
- Newsletter signup endpoint (if included in the project):
  - accepting newsletter submissions and persisting them in the database,
  - validation and error handling patterns.

---

## 3) Key Problems Solved With AI Support

During implementation, AI assistance was used to diagnose and fix:
- Frontend runtime/compile errors based on logs (imports, syntax, lint config issues),
- Gallery layout issues (images too large, not fitting),
- Lightbox wiring (selected index handling, rendering from gallery data),
- Reservations requirements alignment:
  - slot-based scheduling,
  - preventing booking outside opening hours,
  - ensuring a timeslot is not fully occupied,
  - handling reservation overlap using a 60-minute booking window.

---

## 4) Human Review and Verification

All AI-generated or AI-assisted code was reviewed, edited, and tested manually.

### 4.1 Frontend Verification
- Running the React app locally and navigating all pages.
- Confirming:
  - pages render without console errors,
  - layout responsiveness works across breakpoints,
  - gallery thumbnails display correctly and open a working Lightbox (where applicable),
  - reservation form validates required fields,
  - time selection uses 30-minute slots and respects opening hours,
  - the time dropdown renders consistently with a dark background.

### 4.2 Backend Verification
- Running the Flask server locally.
- Testing API endpoints via UI and/or Postman:
  - `POST /api/reservations` with valid/invalid inputs
  - `GET /api/reservations/availability` (or equivalent), where present
  - `POST /api/newsletter` (or equivalent), where present
- Confirming correct status codes and error messaging.

### 4.3 Database Verification
- Confirming that:
  - reservation records are persisted,
  - newsletter signups are persisted (if feature exists),
  - the environment is configured to use **PostgreSQL** as required (not an unintended SQLite fallback).

---

## 5) Scope and Limitations of AI Assistance

- AI suggestions were treated as drafts and refined after testing.
- AI did not have direct access to the developer’s runtime environment; issues were fixed iteratively based on error logs and screenshots provided by the developer.
- Security and correctness decisions (validation rules, time-window overlap logic, opening hours, field requirements, database integration details) were confirmed by human review and runtime testing.

---

## 6) Summary

AI was used as a productivity aid for:
- scaffolding UI components and page layouts,
- implementing and debugging gallery/lightbox UI (where included),
- implementing and verifying reservation flows:
  - 30-minute start slots,
  - 60-minute reservation duration,
  - opening-hours guard,
  - fully-occupied timeslot rejection via table allocation logic,
- drafting Flask API patterns and validation logic,
- iterating on CSS to achieve a consistent premium dark theme (including a custom time dropdown for consistent styling).

Final integration, correctness validation, and acceptance testing were performed by the developer through local builds and runtime checks.
