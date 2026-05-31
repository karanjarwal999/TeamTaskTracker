import type { Response } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function successResponse<T>(
  res: Response,
  message: string,
  data: T,
  status = 200,
  pagination?: Pagination,
): Response {
  const body: Record<string, unknown> = {
    success: true,
    message,
    data,
  };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}

export function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string,
): Response {
  return res.status(status).json({
    success: false,
    status,
    code,
    message,
  });
}

export function noContentResponse(res: Response): Response {
  return res.status(204).end();
}
