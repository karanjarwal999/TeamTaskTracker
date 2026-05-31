import { createHash } from 'crypto';

export const TASK_CACHE_TTL_SECONDS = 60;
const TASK_CACHE_KEY_PREFIX = 'tasks';

interface TaskCacheKeyInput {
  orgId: string;
  userId: string;
  page: number;
  limit: number;
  filters: Record<string, unknown>;
}

// Key shape: tasks:{orgId}:{userId}:{page}:{limit}:{filtersHash}
// userId in the key keeps role-scoped reads (MEMBER vs ADMIN) from colliding
// even when filters look identical.
export function buildTaskListCacheKey(input: TaskCacheKeyInput): string {
  const filtersHash = hashFilters(input.filters);
  return `${TASK_CACHE_KEY_PREFIX}:${input.orgId}:${input.userId}:${input.page}:${input.limit}:${filtersHash}`;
}

export function buildTaskOrgInvalidationPattern(orgId: string): string {
  return `${TASK_CACHE_KEY_PREFIX}:${orgId}:*`;
}

// Stable hash: drop undefined fields, sort keys, then sha1 the JSON.
// First 16 hex chars are enough to make collisions astronomically unlikely
// inside a single org's keyspace, and short enough to keep keys readable.
function hashFilters(filters: Record<string, unknown>): string {
  const sortedKeys = Object.keys(filters)
    .filter((k) => filters[k] !== undefined)
    .sort();
  const canonical: Record<string, unknown> = {};
  for (const k of sortedKeys) canonical[k] = filters[k];
  return createHash('sha1').update(JSON.stringify(canonical)).digest('hex').slice(0, 16);
}
