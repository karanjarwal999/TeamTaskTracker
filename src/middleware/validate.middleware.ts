import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { ValidationError } from '@/shared/errors/domain-errors';

interface ValidateConfig {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(config: ValidateConfig): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (config.body) {
        req.body = config.body.parse(req.body);
      }
      if (config.params) {
        req.params = config.params.parse(req.params) as typeof req.params;
      }
      if (config.query) {
        req.query = config.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join('; ');
        next(new ValidationError('VALIDATION_ERROR', message));
        return;
      }
      next(err);
    }
  };
}
