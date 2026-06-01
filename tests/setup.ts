// Jest setup — runs once per test file before each spec.
// Boots mongodb-memory-server, points Mongoose at it, mocks the Redis-backed
// cache seam (so services that call cacheService never touch a real Redis).

process.env.NODE_ENV = 'test';
process.env.MONGO_URI ??= 'mongodb://test-placeholder/team-task-tracker';
process.env.REDIS_URL ??= 'redis://test-placeholder';
process.env.JWT_SECRET ??= 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.ACCESS_TOKEN_EXPIRES_IN ??= '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN ??= '7d';

jest.mock('@/shared/cache/cache.service', () => ({
  cacheService: {
    get: async () => null,
    set: async () => undefined,
    invalidate: async () => undefined,
    invalidatePattern: async () => undefined,
  },
}));

// Silence the structured logger in tests. The error middleware logs every 4xx
// at `warn`, which Jest would otherwise dump as a "console.warn" stack trace
// next to perfectly green tests, confusing reviewers reading the output.
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  },
}));

import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

// Replica set (not standalone) because org-create and invite use Mongoose
// sessions / transactions, which only run against a replica set.
let mongo: MongoMemoryReplSet | undefined;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
}, 60000);

// No per-test collection wipe — that would erase state between `it` blocks
// in flow-style specs. Specs that need isolation generate unique emails via
// factory.buildUser (or seed in beforeEach themselves).

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
