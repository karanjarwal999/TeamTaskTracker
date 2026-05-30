import { env } from './config/env';
import app from './app';

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', msg: `Listening on :${env.PORT}` }));
});

const shutdown = (signal: string): void => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', msg: `Received ${signal}, shutting down` }));
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
