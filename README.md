# Team Task Tracker API

Multi-tenant backend service for managing team work — organizations, role-based access control, projects, task workflow with server-enforced state transitions, Redis-cached reads, and analytics.

## Quick Start

```bash
cp .env.example .env
# Fill in MONGO_URI (Atlas), JWT_SECRET, JWT_REFRESH_SECRET, FIREBASE_* values
docker compose up
```

The API listens on `http://localhost:5000`. Verify with:

```bash
curl http://localhost:5000/health
```

## Local Development (without Docker)

```bash
npm install
cp .env.example .env  # populate values
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Hot-reload dev server via `ts-node-dev` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm test` | Run Jest integration tests |
| `npm run lint` | ESLint over `src/` and `tests/` |
| `npm run format` | Prettier format all sources |

## Stack

Node.js · Express · TypeScript · MongoDB Atlas (Mongoose) · Redis · Firebase Admin · Zod · JWT · Jest + Supertest · Swagger.
