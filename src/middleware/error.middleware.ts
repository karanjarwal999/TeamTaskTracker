import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '@/shared/errors/domain-errors';
import { STATUS_BY_CODE } from '@/shared/errors/codes';
import { errorResponse } from '@/shared/helpers/response.helper';
import { logger } from '@/shared/utils/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof DomainError) {
    const status = STATUS_BY_CODE[err.code];
    logger.warn('request.failed', {
      reqId: req.reqId,
      code: err.code,
      message: err.message,
    });
    errorResponse(res, status, err.code, err.message);
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    logger.warn('request.failed', {
      reqId: req.reqId,
      code: 'VALIDATION_ERROR',
      message,
    });
    errorResponse(res, 422, 'VALIDATION_ERROR', message);
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error('request.uncaught', {
    reqId: req.reqId,
    message,
    stack,
  });
  errorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error');
};
