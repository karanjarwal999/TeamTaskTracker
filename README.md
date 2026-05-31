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

Tech Stack

Layer| Technology
Runtime| Node.js
Framework| Express.js
Language| TypeScript
Database| MongoDB Atlas + Mongoose
Cache| Redis
Validation| Zod
Authentication| Firebase Auth
Authorization| JWT
API Documentation| Swagger/OpenAPI
Testing| Jest + Supertest
Containerization| Docker + Docker Compose

---

Features

Authentication & Authorization

- Firebase-based authentication
- Backend-issued JWT access tokens
- Refresh token rotation
- Multi-organization membership support
- Role-based access control (RBAC)

Supported roles:

- ADMIN
- MANAGER
- MEMBER

---

Organization Management

- Create organizations
- Invite users to organizations
- Multi-organization support
- Organization-scoped access control

---

Task Management

- Create/update/delete tasks
- Assign tasks to organization members
- Pagination and filtering
- Status transition enforcement
- Task priority support
- Due date management

---

Task Status Workflow

TODO → IN_PROGRESS → IN_REVIEW → DONE
   ↘ BLOCKED

Allowed transitions are enforced server-side.

---

Redis Caching

Task listing APIs are cached using Redis.

Caching includes:

- pagination-aware keys
- organization-aware keys
- filter-aware keys

---

Analytics

Analytics endpoint provides:

- overdue task count per user
- average task completion time

Implemented using MongoDB aggregation pipelines.

---

Project Architecture

Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
MongoDB

---

Folder Structure

src/

├── config/

├── db/

│   ├── connection/

│   ├── models/

│   ├── indexes/

│   ├── plugins/

│   └── seed/

│

├── modules/

│   ├── auth/

│   ├── users/

│   ├── organizations/

│   ├── memberships/

│   ├── projects/

│   ├── tasks/

│   └── analytics/

│

├── middleware/

├── shared/

├── routes/

├── app.ts

└── server.ts


---

API Documentation

Swagger UI available at:

/api/docs

Swagger provides:

- API exploration
- request/response examples
- authentication testing
- endpoint documentation

---

Environment Variables

Create a ".env" file:

PORT=5000

MONGO_URI=

REDIS_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

FIREBASE_WEB_API_KEY=

---

Firebase Authentication Setup

This project uses Firebase Authentication for:

- user registration
- password management
- login verification

Backend still manages:

- JWT authorization
- RBAC
- refresh tokens
- organization membership

---

Getting Started

1. Clone Repository

git clone <repository-url>
cd team-task-tracker-api

---

2. Install Dependencies

npm install

---

3. Configure Environment Variables

Create ".env" using the example above.

---

4. Start Redis

Using Docker:

docker compose up -d

---

5. Start Development Server

npm run dev

---

Docker Setup

Run services:

docker compose up

Services:

- API server
- Redis

MongoDB is connected through MongoDB Atlas.

---

Authentication Flow

Register

POST /auth/register

- User must already be invited to an organization
- Backend creates Firebase user
- Backend issues JWT tokens

---

Login

POST /auth/login

- Backend verifies credentials using Firebase Auth
- Backend issues JWT tokens

---

Refresh Token

POST /auth/refresh

Implements refresh token rotation.

---

Organization Context

All protected APIs require:

x-organization-id

Example:

GET /tasks
Authorization: Bearer access_token
x-organization-id: organization_id

---

RBAC Rules

Action| ADMIN| MANAGER| MEMBER

Create organization| ✅| ❌| ❌

Invite users| ✅| ❌| ❌

Create projects| ✅| ✅| ❌

Create tasks| ✅| ✅| ❌

Assign tasks| ✅| ✅| ❌

View assigned tasks| ✅| ✅| ✅

Update task status| ✅| ✅| Assigned only

Delete tasks| ✅| ✅| ❌

---

Caching Strategy

Only task list APIs are cached.

Cache key format:

tasks:{orgId}:{userId}:{page}:{limit}:{filtersHash}

---

Cache Invalidation Strategy

Task cache invalidation occurs on:

- task creation
- task updates
- task deletion
- task reassignment
- status updates

Implementation uses:

- Redis SCAN + DEL

Reason:

- simple implementation
- sufficient for assignment scale

---

Database Design Decision

A compound MongoDB index was added:

{
  organizationId,
  assigneeId,
  status
}

Reason:
Task listing frequently filters by:

- organization
- assignee
- status

This reduces scanned documents and improves query performance.

---

Error Response Format

All APIs return consistent error responses.

Example:

{
  "success": false,
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "due_date must be a future date"
}

---

Testing

Integration tests are implemented using:

- Jest
- Supertest
- mongo-memory-server

Planned critical flows:

- RBAC protection
- invalid task transitions

---

Scripts

npm run dev
npm run build
npm run start
npm run test
npm run lint

---

Future Improvements

Given more time, the following improvements could be added:

- websocket notifications
- background job queues
- audit logging
- rate limiting
- monitoring/logging
- advanced analytics
- role permission customization
- soft delete support

---

Engineering Principles

- Thin controllers
- Middleware-driven RBAC
- Centralized error handling
- Explicit module boundaries
- Service-layer business logic
- Repository-layer DB isolation
- Readability over abstraction
- Minimal overengineering



## Reviewer Notes

Due to limited availability during the assignment window, the primary focus of this implementation was on:

- backend architecture
- code organization
- RBAC correctness
- maintainability
- separation of concerns
- scalable API design

While some areas such as broader end-to-end testing and production hardening could be expanded further, special attention was given to keeping the codebase structured, modular, and aligned with realistic backend engineering practices.

I would especially appreciate feedback around:

- overall code quality
- architectural decisions
- module boundaries
- service/repository layering
- RBAC implementation
- maintainability and scalability of the structure

