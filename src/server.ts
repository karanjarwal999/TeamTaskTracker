import type { Server } from 'http';
import { env } from './config/env';
import app from './app';
import { connectMongo, disconnectMongo } from './db/connection/mongo';
import { connectRedis, disconnectRedis } from './config/redis';
import { initFirebase } from './config/firebase';

/* eslint-disable no-console */
const bootLog = (msg: string): void => {
  console.log(JSON.stringify({ level: 'info', msg }));
};

const bootError = (msg: string, err?: unknown): void => {
  console.error(JSON.stringify({ level: 'error', msg, err: String(err) }));
};
/* eslint-enable no-console */

async function bootstrap(): Promise<void> {
  initFirebase();
  bootLog('Firebase Admin initialized');

  await connectMongo();
  bootLog('Mongo connected');

  await connectRedis();
  bootLog('Redis connected');

  const server: Server = app.listen(env.PORT, () => {
    bootLog(`Listening on :${env.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    bootLog(`Received ${signal}, shutting down`);

    // This is called graceful shutdown.
    // stops new incoming requests
    // waits for active requests to finish
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectMongo();
    await disconnectRedis();
    process.exit(0);
  };

  // stopped by Docker Kubernetes
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  // manully stopped by Ctrl+C
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

bootstrap().catch((err) => {
  bootError('Bootstrap failed', err);
  process.exit(1);
});
