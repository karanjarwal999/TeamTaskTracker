# Team Task Tracker API

A backend-focused Team Task Tracker API built for the SDE II take-home assignment.

The project demonstrates:

- scalable backend architecture
- RBAC authorization
- multi-organization support
- task workflow management
- Redis caching
- Dockerized development
- Swagger API documentation
- integration testing

---

## Tech Stack

| Layer             | Technology                  |
| ----------------- | --------------------------- |
| Runtime           | Node.js (>= 20)             |
| Framework         | Express.js                  |
| Language          | TypeScript                  |
| Database          | MongoDB Atlas + Mongoose    |
| Cache             | Redis                       |
| Validation        | Zod                         |
| Authentication    | Local password hash (scrypt); Firebase Auth optional |
| Authorization     | Backend-issued JWT + RBAC   |
| API Documentation | Swagger / OpenAPI           |
| Testing           | Jest + Supertest            |
| Containerization  | Docker + Docker Compose     |

---

## Architecture

```
Routes → Middleware → Controllers → Services → Repositories → MongoDB
```

```
src/
├── config/                  env, firebase, redis, swagger
├── db/
│   ├── connection/
│   ├── models/
│   └── seed/                admin bootstrap script
├── modules/
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   ├── memberships/
│   ├── projects/
│   ├── tasks/
│   └── analytics/
├── middleware/
├── shared/
├── routes/
├── app.ts
└── server.ts
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below. The app validates env at boot via Zod and exits if any required var is missing.

```env
PORT=5000
NODE_ENV=development

# MongoDB connection string. Atlas (mongodb+srv://...) or local Mongo.
# Local replica set required for org-create / invite transactions:
#   docker run -d -p 27017:27017 mongo:7 --replSet rs0 && \
#   docker exec <cid> mongosh --eval 'rs.initiate()'
MONGO_URI=mongodb://localhost:27017/team-task-tracker?directConnection=true&replicaSet=rs0

# Redis. When running via docker compose, use redis://redis:6379
# When running the API directly on the host, use redis://localhost:6379
REDIS_URL=redis://redis:6379

# JWT secrets — any sufficiently random strings
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Firebase (OPTIONAL — disabled by default; auth uses a local scrypt hash).
# Leave blank unless you re-enable the Firebase blocks in auth.service.ts and admin.seed.ts.
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_API_KEY=

# Comma-separated list, e.g. http://localhost:3000,https://app.example.com
CORS_ORIGINS=http://localhost:3000

# --- Admin bootstrap (consumed by `npm run seed:admin`) ---
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD="AdminPass#1234"   # quote values containing `#` — dotenv treats it as a comment otherwise
ADMIN_NAME=System Admin
BOOTSTRAP_ORG_NAME=Bootstrap Organization
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# then fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET
# FIREBASE_* are optional — leave blank unless you re-enable Firebase auth
```

### 3. Start Redis (and optionally the API) with Docker

```bash
docker compose up -d
```

This brings up Redis on `localhost:6379` and the API on `localhost:5000`. MongoDB is hosted on Atlas — no local Mongo container.

If you prefer to run the API directly on the host:

```bash
docker compose up -d redis
npm run dev
```

### 4. Bootstrap the admin account (one-time)

```bash
npm run seed:admin
```

This script is **idempotent** and does the following:

1. Creates the **User** document in MongoDB with a scrypt hash of `ADMIN_PASSWORD`.
2. Creates a **bootstrap Organization** (`BOOTSTRAP_ORG_NAME`).
3. Attaches the admin to that org with the **ADMIN** role.

Re-running it is safe — every step skips if the record already exists.

> Why a bootstrap org? Login requires at least one membership. Seeding a starter org lets the reviewer log in immediately and gives a sandbox org to test against. The admin is also free to create additional orgs via `POST /organizations`.

---

## Reviewer Test Walkthrough

The following walkthrough exercises every major flow: org creation, project creation, inviting a manager and a member, and operating as those users.

API base URL: `http://localhost:5000`
Swagger UI: `http://localhost:5000/api/docs`

> **Note on invites.** SMTP delivery is a planned future improvement. Until then, `POST /organizations/:id/invite` returns the new user's `initialPassword` directly in the response, along with the message: *"Invite dispatched. Share initialPassword with the invitee (email delivery is a future improvement)."* Use that password to sign in as the invited user.

### Step 1 — Log in as the seeded admin

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "AdminPass#1234"
}
```

Save the `accessToken` from the response — every subsequent request uses it as `Authorization: Bearer <accessToken>`.

### Step 2 — Create a fresh organization (optional)

```http
POST /organizations
Authorization: Bearer <admin accessToken>
Content-Type: application/json

{ "name": "Acme Engineering" }
```

The caller automatically becomes the new org's ADMIN. Save the returned `organization.id` as `<ORG_ID>` — it goes in the `x-organization-id` header for every org-scoped call below.

(You can also skip this step and use the bootstrap org's id, available via `GET /organizations`.)

### Step 3 — Create a project

```http
POST /projects
Authorization: Bearer <admin accessToken>
x-organization-id: <ORG_ID>
Content-Type: application/json

{ "name": "Website Revamp", "description": "Q3 marketing site refresh" }
```

### Step 4 — Invite a manager

```http
POST /organizations/<ORG_ID>/invite
Authorization: Bearer <admin accessToken>
x-organization-id: <ORG_ID>
Content-Type: application/json

{ "email": "manager@example.com", "role": "MANAGER" }
```

Response includes:

```json
{
  "message": "Invite dispatched. Share initialPassword with the invitee (email delivery is a future improvement).",
  "data": {
    "user":   { "id": "...", "email": "manager@example.com", "name": "manager@example.com", "isRegistered": false },
    "membership": { "id": "...", "role": "MANAGER", "organizationId": "...", "userId": "..." },
    "initialPassword": "Xy7$kP2!aQ9z"
  }
}
```

Copy that `initialPassword` — that's the manager's password.

### Step 5 — Invite a member

Same call, role `MEMBER`:

```http
POST /organizations/<ORG_ID>/invite
Authorization: Bearer <admin accessToken>
x-organization-id: <ORG_ID>
Content-Type: application/json

{ "email": "member@example.com", "role": "MEMBER" }
```

Save the returned `initialPassword` and the new user's `id` (you'll need it as an assignee).

### Step 6 — Log in as the manager

```http
POST /auth/login
Content-Type: application/json

{ "email": "manager@example.com", "password": "<manager initialPassword>" }
```

Save the manager's `accessToken`.

### Step 7 — Manager creates and assigns a task

```http
POST /tasks
Authorization: Bearer <manager accessToken>
x-organization-id: <ORG_ID>
Content-Type: application/json

{
  "title": "Draft landing page copy",
  "description": "First pass for the hero section",
  "priority": "HIGH",
  "dueDate": "2026-12-31",
  "projectId": "<PROJECT_ID>",
  "assigneeId": "<member user id>"
}
```

### Step 8 — Log in as the member

```http
POST /auth/login
Content-Type: application/json

{ "email": "member@example.com", "password": "<member initialPassword>" }
```

### Step 9 — Member transitions the task

```http
GET /tasks
Authorization: Bearer <member accessToken>
x-organization-id: <ORG_ID>
```

The member only sees tasks assigned to them. Move the task forward:

```http
PATCH /tasks/<TASK_ID>/status
Authorization: Bearer <member accessToken>
x-organization-id: <ORG_ID>
Content-Type: application/json

{ "status": "IN_PROGRESS" }
```

Allowed status transitions are enforced server-side:

```
TODO → IN_PROGRESS → IN_REVIEW → DONE
   ↘ BLOCKED
```

### Step 10 — Check analytics (admin or manager)

```http
GET /analytics/tasks
Authorization: Bearer <admin or manager accessToken>
x-organization-id: <ORG_ID>
```

Returns overdue counts per assignee and average completion time, computed via a MongoDB aggregation pipeline.

---

## Running Tests

The full walkthrough above is also exercised end-to-end by the integration test suite, so a reviewer can verify everything in one command — **no Docker, Atlas, or Redis needed**. The harness boots a single-node `mongodb-memory-server` replica set in-process and mocks the Redis cache seam.

```bash
npm test
```

Expected output (3 suites, 36 tests, ~25–30s):

```
PASS tests/integration/full-flow.spec.ts
  Full-flow walkthrough — admin → manager → member
    Public / health
      ✓ GET /health → 200
      ✓ GET /api/docs.json → 200
    Phase 1 — Admin onboarding
      ✓ POST /auth/login as seeded admin → 200 with token pair
      ✓ GET /organizations lists the bootstrap org with role ADMIN
      ✓ POST /organizations creates Acme and grants caller ADMIN atomically
      ✓ GET /organizations/:id returns the new org
    Phase 2 — Project setup
      ✓ POST /projects creates a project under Acme
      ✓ GET /projects lists the project
      ✓ GET /projects/:id returns the project
    Phase 3 — Invites (admin → manager + member)
      ✓ POST /organizations/:id/invite creates a MANAGER and returns initialPassword
      ✓ POST /organizations/:id/invite creates a MEMBER
      ✓ GET /organizations/:id/memberships shows admin + manager + member
    Phase 4 — Manager workflow
      ✓ POST /auth/login as manager with invite-issued initialPassword
      ✓ POST /tasks creates a HIGH-priority task assigned to the member
      ✓ GET /tasks (manager view) sees all org tasks
      ✓ GET /tasks/:id returns the task
      ✓ PATCH /tasks/:id updates description + priority
    Phase 5 — Member workflow + status state machine
      ✓ POST /auth/login as member
      ✓ GET /tasks (member view) sees only assigned tasks
      ✓ PATCH /tasks/:id/status TODO → IN_PROGRESS
      ✓ PATCH /tasks/:id/status IN_PROGRESS → IN_REVIEW
      ✓ PATCH /tasks/:id/status IN_REVIEW → DONE stamps completedAt
    Phase 6 — Analytics
      ✓ GET /analytics/tasks returns the analytics envelope to admin
    Phase 7 — RBAC negative checks
      ✓ MEMBER POST /tasks → 403 FORBIDDEN_ROLE
      ✓ MEMBER POST /organizations/:id/invite → 403 FORBIDDEN_ROLE
      ✓ Unauthenticated GET /organizations → 401
    Phase 8 — Admin manages memberships
      ✓ PATCH /memberships/:id promotes member to MANAGER
      ✓ DELETE /memberships/:id revokes the original manager
    Phase 9 — Auth refresh + change-password
      ✓ POST /auth/refresh rotates the admin token pair
      ✓ POST /auth/refresh with the OLD token now returns 401
      ✓ POST /auth/change-password updates the password and re-login succeeds
    Phase 10 — Project + task cleanup
      ✓ PATCH /projects/:id renames the project
      ✓ DELETE /tasks/:id removes the task
      ✓ DELETE /projects/:id removes the project

PASS tests/integration/task-transitions.spec.ts
  ✓ TODO → DONE → 422 INVALID_TRANSITION

PASS tests/integration/rbac.spec.ts
  ✓ MEMBER POST /tasks → 403 FORBIDDEN_ROLE

Test Suites: 3 passed, 3 total
Tests:       36 passed, 36 total
```

### Layout

```
tests/
├── setup.ts                          # boots in-memory replica set, mocks Redis cache
├── helpers/
│   ├── auth.helper.ts                # mints backend access tokens for seeded users
│   ├── factory.ts                    # buildUser/Org/Membership/Project/Task seeders
│   └── request.ts                    # supertest wrapper that attaches headers
└── integration/
    ├── full-flow.spec.ts             # the reviewer walkthrough, end-to-end
    ├── rbac.spec.ts                  # FR-23 (a) — MEMBER cannot create tasks
    └── task-transitions.spec.ts      # FR-23 (b) — TODO → DONE rejected
```

The first run downloads the in-memory Mongo binary (~50–80 MB, cached after); subsequent runs start in ~5 seconds.

---

## API Surface

| Method | Path                              | Roles                  |
| ------ | --------------------------------- | ---------------------- |
| POST   | `/auth/login`                     | public                 |
| POST   | `/auth/refresh`                   | public (refresh token) |
| POST   | `/auth/change-password`           | public                 |
| POST   | `/organizations`                  | any authenticated user |
| GET    | `/organizations`                  | any authenticated user |
| GET    | `/organizations/:id`              | org member             |
| POST   | `/organizations/:id/invite`       | ADMIN                  |
| GET    | `/organizations/:id/memberships`  | org member             |
| POST   | `/projects`                       | ADMIN, MANAGER         |
| GET    | `/projects`                       | org member             |
| GET    | `/projects/:id`                   | org member             |
| PATCH  | `/projects/:id`                   | ADMIN, MANAGER         |
| DELETE | `/projects/:id`                   | ADMIN, MANAGER         |
| POST   | `/tasks`                          | ADMIN, MANAGER         |
| GET    | `/tasks`                          | org member (filtered)  |
| GET    | `/tasks/:id`                      | org member (filtered)  |
| PATCH  | `/tasks/:id`                      | ADMIN, MANAGER         |
| PATCH  | `/tasks/:id/status`               | any role, MEMBER must be assignee |
| DELETE | `/tasks/:id`                      | ADMIN, MANAGER         |
| GET    | `/analytics/tasks`                | ADMIN, MANAGER         |

All org-scoped routes require an `x-organization-id` header.

---

## Authentication

Password verification runs against a **scrypt hash stored on the `User` document** (via `node:crypto`, no external dependency). Firebase Auth is supported but **disabled by default** — the env vars are optional and Firebase calls in `auth.service.ts`, `admin.seed.ts`, and `firebase-auth.ts` are gated behind `=== FIREBASE (DISABLED) ===` comment blocks.

To re-enable Firebase:

1. Populate `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_API_KEY` in `.env`.
2. Tighten the four `FIREBASE_*` fields in `src/config/env.ts` to `.min(1, ...)`.
3. Uncomment the Firebase blocks in `src/modules/auth/auth.service.ts` and `src/db/seed/admin.seed.ts` and remove the local-hash fallbacks.

---

## Caching Notes

List reads for tasks, organizations, and projects are cached in Redis with org- and user-scoped keys, and invalidated on the corresponding write (create / update / delete / reassign / status change).

ID-based reads (`GET /tasks/:id`, `GET /projects/:id`, `GET /organizations/:id`) are **deliberately not cached** — they are cheap point lookups and caching adds invalidation surface without a meaningful win.

---

## Error Response Format

```json
{
  "success": false,
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "due_date must be a future date"
}
```

---

## Scripts

```bash
npm run dev          # ts-node-dev hot reload
npm run build        # tsc + tsc-alias
npm run start        # node dist/server.js
npm run test         # jest --runInBand (in-memory Mongo, no infra needed)
npm run lint         # eslint
npm run seed:admin   # bootstrap admin user + first org in Mongo
```

---

## Future Improvements

- SMTP-backed invite delivery (replace the in-response `initialPassword`)
- WebSocket task notifications
- Background job queues
- Audit logging
- Rate limiting
- Role permission customization
- Soft delete

---

## Reviewer Notes

Focus during this implementation window was on backend architecture, RBAC correctness, module boundaries, and maintainability. Feedback especially welcome on:

- overall code quality
- architectural decisions
- service / repository layering
- RBAC implementation
- scalability of the structure
