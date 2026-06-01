import supertest, { type Test } from 'supertest';
import app from '@/app';

type Method = 'get' | 'post' | 'patch' | 'delete';

export function authedRequest(token: string, orgId?: string) {
  return (method: Method, path: string): Test => {
    const req = supertest(app)[method](path).set('authorization', `Bearer ${token}`);
    if (orgId) req.set('x-organization-id', orgId);
    return req;
  };
}
