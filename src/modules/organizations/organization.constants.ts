export const ORG_LIST_CACHE_TTL_SECONDS = 60;

// One key per user — listMine is "my organizations" with role per org.
export function buildOrgListCacheKey(userId: string): string {
  return `orgs:user:${userId}`;
}
