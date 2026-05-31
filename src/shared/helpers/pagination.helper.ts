import type { Pagination } from './response.helper';

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePageLimit(input: PaginationInput): PaginationParams {
  const page = Math.max(1, input.page ?? 1);
  const rawLimit = input.limit ?? 10;
  const limit = Math.max(1, Math.min(100, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPagination(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
