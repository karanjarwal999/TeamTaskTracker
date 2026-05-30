import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { successResponse } from './shared/helpers/response.helper';

const app: Application = express();

// Request id MUST be first — every log line we DO emit downstream needs it.
app.use(requestIdMiddleware);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  successResponse(res, 'OK', { status: 'ok' });
});

// Error handler MUST be the very last middleware.
app.use(errorMiddleware);

export default app;
