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
| Authentication    | Firebase Auth (email/pwd)   |
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

# MongoDB Atlas connection string (mongodb+srv://...)
MONGO_URI=MONGO_URI=mongodb://localhost:27017/team-task-tracker

# Redis. When running via docker compose, use redis://redis:6379
# When running the API directly on the host, use redis://localhost:6379
REDIS_URL=redis://redis:6379

# JWT secrets — any sufficiently random strings
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Firebase Admin SDK service account (Project settings → Service accounts → Generate new private key)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
# Paste the full PEM block. Use literal \n escapes inside one line OR a multi-line quoted value.
FIREBASE_PRIVATE_KEY=

# Firebase Web API Key (Project settings → General → Web API Key)
# Used by the backend to verify passwords via signInWithPassword REST.
FIREBASE_API_KEY=

# Comma-separated list, e.g. http://localhost:3000,https://app.example.com
CORS_ORIGINS=http://localhost:3000

# --- Admin bootstrap (consumed by `npm run seed:admin`) ---
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass@1234
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
# then fill in MONGO_URI, FIREBASE_*, JWT_SECRET, JWT_REFRESH_SECRET
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

1. Creates the admin user in **Firebase Auth** with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. Creates the matching **User** document in MongoDB (linked to the Firebase UID).
3. Creates a **bootstrap Organization** (`BOOTSTRAP_ORG_NAME`).
4. Attaches the admin to that org with the **ADMIN** role.

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
npm run test         # jest --runInBand
npm run lint         # eslint
npm run seed:admin   # bootstrap admin user, Firebase + DB + first org
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
