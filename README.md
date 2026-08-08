# Loan Management System (LMS)

A full-stack lending platform built with the MERN stack (Next.js + TypeScript on the
frontend, Express + TypeScript + MongoDB on the backend). It has two parts:

- **Borrower Portal** — sign up, complete a 4-step application (personal details + BRE
  eligibility check, salary slip upload, loan configuration with live interest calculation).
- **Operations Dashboard** — 4 role-gated modules (Sales, Sanction, Disbursement,
  Collection) that move a loan through its lifecycle.

```
lms/
├── docker-compose.yml
├── backend/     Express + TypeScript + Mongoose API
└── frontend/    Next.js (App Router) + TypeScript + Tailwind
```

## 1. Run it with Docker (recommended — one command)

**Prerequisite:** Docker Desktop (or Docker Engine + Compose) installed. Nothing else —
no local Node.js, no local MongoDB.

```bash
docker compose up --build
```

That's it. This spins up three containers:

- **mongo** — MongoDB 7, with a healthcheck the backend waits on
- **backend** — the API, on http://localhost:5000
- **frontend** — the Next.js app, on http://localhost:3000

The backend **auto-seeds one account per role the first time it connects to an empty
database** — no manual seed step needed. Data persists across restarts in a named
Docker volume (`mongo-data`), so `docker compose up` again later won't wipe your test
data. To force a clean slate:

```bash
docker compose down -v   # -v also removes the mongo-data and uploads-data volumes
docker compose up --build
```

Open **http://localhost:3000** and log in with any of the credentials in section 4.

To reseed on demand without wiping the whole stack:

```bash
docker compose exec backend npm run seed
```

## 2. Alternative: run without Docker

If you'd rather run things natively, you'll need Node.js 18+ and a MongoDB instance
(local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI to your local or Atlas connection string,
# and set JWT_SECRET to a long random string
npm install
npm run dev     # starts the API on http://localhost:5000 (auto-seeds on first boot)
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL should point at the backend, e.g. http://localhost:5000/api
npm install
npm run dev     # starts the app on http://localhost:3000
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## 3. Seeded login credentials

All seeded accounts use the password **`Password123`**.

| Role         | Email                 |
| ------------ | --------------------- |
| Admin        | admin@lms.test        |
| Sales        | sales@lms.test        |
| Sanction     | sanction@lms.test     |
| Disbursement | disbursement@lms.test |
| Collection   | collection@lms.test   |
| Borrower     | borrower@lms.test     |

Admin can see all 4 dashboard modules. Each executive role sees only their own module.
Borrowers are restricted to the application portal.

To test the **full borrower journey from scratch**, sign up a new account at `/signup`
instead of using the seeded borrower — this creates a fresh `LEAD` record that Sales
will see, then walks through personal details → BRE → salary slip → loan config → apply.

## 4. End-to-end flow to demo

1. Sign up a new borrower → appears in **Sales** as a lead.
2. Complete Personal Details.
   - Try an underage DOB, salary under ₹25,000, or "Unemployed" to see the BRE **reject**
     with reasons.
   - Then submit valid details to pass.
3. Upload a salary slip (PDF/JPG/PNG, ≤5MB).
4. Configure loan amount (₹50K–₹5L) and tenure (30–365 days) with the sliders — watch the
   live Simple Interest panel — then **Apply**. Loan status → `APPLIED`.
5. Log in as **Sanction** → approve or reject (with reason). Status → `SANCTIONED` or
   `REJECTED`.
6. Log in as **Disbursement** → mark the sanctioned loan as disbursed. Status →
   `DISBURSED`.
7. Log in as **Collection** → record payments against the loan (unique UTR required per
   payment). Once total paid = total repayment, the loan **auto-closes** → `CLOSED`.

## 5. Design notes

**Data model.** A single `Loan` collection represents a borrower's record end-to-end —
it starts as a `LEAD` at signup (so Sales can see registered-but-not-applied users),
then accumulates `personalDetails`, `breResult`, `salarySlip`, and finally the applied
loan terms once the borrower clicks Apply. Status transitions:

```
LEAD → APPLIED → SANCTIONED → DISBURSED → CLOSED
                → REJECTED  (terminal)
```

**BRE placement.** The Business Rule Engine (`backend/src/utils/bre.ts`) runs on the
**server**, since eligibility is the actual gate that controls money — it can't be
trusted to the client. A lightweight mirror of the same rules exists in
`frontend/lib/bre.ts` purely to show inline validation hints as the user types; the
server's response is always the source of truth for whether the application is accepted.

**PAN regex.** `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` — the standard 10-character Indian PAN
format (5 letters, 4 digits, 1 letter).

**RBAC.** Roles live on the `User` document (`admin | sales | sanction | disbursement |
collection | borrower`). `requireAuth` middleware verifies the JWT (sent as an httpOnly
cookie); `requireRole(...)` middleware checks the role and lets `admin` through
automatically. Unauthorized requests get `401` (not authenticated) or `403` (wrong
role) — enforced on **every** dashboard/application API route, not just hidden in the
UI. The frontend also gates routes client-side (`components/RequireRole.tsx`) purely
for UX; it is not the security boundary.

**Loan math.** Simple Interest: `SI = (P × R × T) / (365 × 100)`, `T` in days, rate
fixed at 12% p.a. `Total Repayment = P + SI`. Implemented once in
`backend/src/utils/loanCalc.ts` and mirrored in the frontend only for the live slider
preview; the authoritative numbers are computed and stored server-side on Apply.

**Auto-seeding.** The backend checks on every boot whether the `User` collection is
empty and, if so, seeds one account per role (`backend/src/seedData.ts`). This means
`docker compose up` alone is enough for an evaluator to get working credentials — no
separate seed command required — while restarts of an already-seeded database are a
no-op. `npm run seed` is still available as a manual, destructive reseed for local dev.

**Payments.** UTR numbers are enforced unique via a MongoDB unique index on
`Payment.utrNumber` (global, not per-loan), plus an application-level check for a
cleaner error message. Payment amount is capped at the loan's current outstanding
balance. A loan's `outstandingBalance` is decremented on each payment and the loan
flips to `CLOSED` once it reaches zero.

## 6. Project structure

```
docker-compose.yml            orchestrates mongo + backend + frontend
backend/Dockerfile            multi-stage build → compiled dist/ + node runtime
frontend/Dockerfile           multi-stage build → Next.js standalone output
backend/src/
├── config/db.ts              MongoDB connection (retries on boot for Docker startup ordering)
├── models/                   User, Loan, Payment (Mongoose schemas)
├── middleware/                auth.ts (JWT), rbac.ts (role checks)
├── controllers/                auth, application (borrower flow), dashboard (sales/sanction/disbursement), payment (collection)
├── routes/                    one router per controller
├── utils/                     bre.ts, loanCalc.ts, jwt.ts, upload.ts (multer)
├── seed.ts                    creates one account per role
├── app.ts / server.ts         Express app + entry point

frontend/
├── app/
│   ├── login, signup/         auth pages
│   ├── apply/                 4-step borrower journey + status page
│   └── dashboard/              sales, sanction, disbursement, collection modules
├── components/                Navbar, RequireRole (client-side RBAC gate), StepIndicator
└── lib/                       api.ts (fetch wrapper), auth-context.tsx, bre.ts (UX-only mirror), types.ts
```

## 7. What's intentionally left for you to extend

This scaffold covers the full happy-path flow end-to-end (evaluation focus: working
flow, BRE + loan math, RBAC, TypeScript). Depending on time, consider adding:

- Editing/resubmitting a `REJECTED` application (currently a fresh signup starts a new one)
- Pagination on dashboard list views
- Toast notifications instead of inline error text
- Automated tests (Jest/Supertest for the API, Playwright for the flow)
