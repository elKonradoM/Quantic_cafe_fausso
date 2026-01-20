# AI_DISCLOSURE.md

## Project: Café Fausse (React + Flask + PostgreSQL)

This document describes how AI-assisted code generation was used during the development of the Café Fausse web application, and how the generated outputs were verified and integrated into the final solution.

---

## 1) AI Tools Used

- **ChatGPT (OpenAI)** — used as an assistant for:
  - generating initial project scaffolding suggestions (React + Flask structure),
  - producing component code drafts and API wiring,
  - creating/adjusting CSS rules for the chosen dark “premium” UI theme,
  - debugging runtime errors and refining implementation details based on observed issues.

No automated code execution tools were used by the AI on the target environment. All integration, builds, and runtime testing were performed locally by the developer.

---

## 2) What Was Created or Modified With AI Help

### 2.1 Frontend (React)
AI assistance was used to draft and refine:
- A multi-page React app using JSX with navigation and routing (minimum five pages):
  - `Home`, `Menu`, `Reservations`, `About`, `Gallery`
- Shared layout components:
  - `Navbar`, `Footer`, `Hero`
- API helper wiring for frontend-to-backend communication:
  - `api.js` (JSON POST helper patterns)
- UI behavior and interaction refinements:
  - **Gallery thumbnails + Lightbox** behavior (open/close, navigation, selected index handling)
  - Adjustments to render additional data sections like **Awards** and **Reviews** from `data/gallery.js`
- Form UI and validation patterns for:
  - Reservations form
  - Newsletter signup form (later updated to include mandatory name fields per requirements)

### 2.2 Styling (CSS)
AI help was used to:
- build a cohesive dark theme with consistent spacing, typography, and components,
- apply **Flexbox / CSS Grid** layouts for responsive UX:
  - two-column layouts for key pages (`grid2`),
  - gallery grids with responsive breakpoints,
- improve gallery visuals (thumbnail sizing, object-fit, hover behavior),
- troubleshoot and iterate on the **date/time picker icon** visibility issues for dark inputs.

> Note: Some iterations introduced unintended styling side effects (global icon overrides). The final approach was refined to avoid breaking appearance across the site.

### 2.3 Backend (Flask + Database)
AI assistance was used to draft and refine:
- Flask API routes for core functionality:
  - **Reservations** endpoint that accepts a datetime slot + party size + contact fields
  - Business logic to allocate a table number from a finite pool, and reject fully booked slots
- Newsletter signup endpoint:
  - Accepting newsletter submissions and writing to the database
  - Later updated to include mandatory name fields
- Database model suggestions and validation logic patterns.

---

## 3) Key Problems Solved With AI Support

During implementation, AI assistance was used to diagnose and fix:
- Frontend runtime errors (e.g. missing variable/import issues like `GALLERY is not defined`)
- Gallery layout issues (images too large, not fitting)
- Lightbox wiring (selected index handling, rendering from `galleryImages`)
- Ensuring the Gallery page displays all required data sections (e.g. **AWARDS** and **REVIEWS**)
- Dark UI input problems:
  - the native calendar icon not visible on dark backgrounds,
  - aligning and restoring a single, usable icon without breaking global styles.

---

## 4) Human Review and Verification

All AI-generated or AI-assisted code was reviewed, edited, and tested manually. Verification steps included:

### 4.1 Frontend Verification
- Running the React app locally and navigating all pages.
- Confirming:
  - pages render without console errors,
  - layout responsiveness behaves correctly across breakpoints,
  - gallery thumbnails display correctly and open a working Lightbox,
  - forms validate required fields and show success/error messages.

### 4.2 Backend Verification
- Running the Flask server locally (`flask run`).
- Testing API endpoints using the browser UI and/or Postman:
  - `POST /api/reservations` with valid/invalid inputs
  - `POST /api/newsletter` (or equivalent) for newsletter signup
- Confirming appropriate status responses and error messaging.

### 4.3 Database Verification
- Ensuring migrations / table creation steps were executed (as applicable).
- Confirming that:
  - reservation records are persisted,
  - newsletter signups are persisted with required fields.

> If a PostgreSQL deployment is required by the SRS, the final verification includes confirming that the application is configured to use PostgreSQL (not SQLite fallback) and that records are written to the PostgreSQL instance.

---

## 5) Scope and Limitations of AI Assistance

- AI suggestions were **not** blindly copied; they were treated as drafts and refined after testing.
- AI did not have direct access to the developer’s runtime environment; issues were fixed iteratively based on error logs and screenshots provided by the developer.
- Security and correctness decisions (validation, error handling, field requirements, and database integration details) were confirmed by human review and runtime testing.

---

## 6) Summary

AI was used as a productivity aid for:
- scaffolding UI components and page layouts,
- implementing and debugging the gallery/lightbox UI,
- implementing and verifying form flows (reservations/newsletter),
- drafting Flask API patterns and database model logic,
- iterating on CSS to achieve a consistent premium dark theme.

Final integration, correctness validation, and acceptance testing were performed by the developer through local builds and runtime checks.
