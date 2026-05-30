import type { Server } from 'http';
import { env } from './config/env';
import app from './app';
import { connectMongo, disconnectMongo } from './db/connection/mongo';
import { connectRedis, disconnectRedis } from './config/redis';
import { initFirebase } from './config/firebase';
import { logger } from './shared/utils/logger';

async function bootstrap(): Promise<void> {
  initFirebase();
  logger.info('Firebase Admin initialized');

  await connectMongo();
  logger.info('Mongo connected');

  await connectRedis();
  logger.info('Redis connected');

  const server: Server = app.listen(env.PORT, () => {
    logger.info(`Listening on :${env.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal}, shutting down`);

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
  logger.error('Bootstrap failed', { err: String(err) });
  process.exit(1);
});
