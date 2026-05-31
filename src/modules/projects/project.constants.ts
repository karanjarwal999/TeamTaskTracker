export const PROJECT_LIST_CACHE_TTL_SECONDS = 60;

// Key per (org, page, limit). All members of an org see the same project list,
// so userId is NOT in the key (unlike tasks where MEMBER scoping differs).
export function buildProjectListCacheKey(orgId: string, page: number, limit: number): string {
  return `projects:org:${orgId}:${page}:${limit}`;
}

export function buildProjectOrgInvalidationPattern(orgId: string): string {
  return `projects:org:${orgId}:*`;
}
