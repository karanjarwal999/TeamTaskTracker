import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { successResponse } from './shared/helpers/response.helper';
import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import membershipRoutes from './modules/memberships/membership.routes';

const app: Application = express();

// Request id MUST be first — every log line we DO emit downstream needs it.
app.use(requestIdMiddleware);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  successResponse(res, 'OK', { status: 'ok' });
});

// Module routes
app.use('/auth', authRoutes);
app.use('/organizations', organizationRoutes);
app.use('/memberships', membershipRoutes);

// Error handler MUST be the very last middleware.
app.use(errorMiddleware);

export default app;
