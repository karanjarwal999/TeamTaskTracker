import 'dotenv/config';
import app from './app';

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', msg: `Listening on :${PORT}` }));
});

const shutdown = (signal: string): void => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', msg: `Received ${signal}, shutting down` }));
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
