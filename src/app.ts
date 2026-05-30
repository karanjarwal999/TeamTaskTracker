import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'OK',
    data: { status: 'ok' },
  });
});

export default app;
