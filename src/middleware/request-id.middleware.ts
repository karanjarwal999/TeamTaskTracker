import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const reqId = incoming && incoming.length > 0 ? incoming : randomUUID();
  req.reqId = reqId;
  res.setHeader('x-request-id', reqId);
  next();
}
