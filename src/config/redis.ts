import Redis from 'ioredis';
import { env } from './env';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  const c = getRedis();
  if (c.status === 'ready') return;

  await new Promise<void>((resolve, reject) => {
    const onReady = (): void => {
      c.off('error', onError);
      resolve();
    };
    const onError = (err: Error): void => {
      c.off('ready', onReady);
      reject(err);
    };
    c.once('ready', onReady);
    c.once('error', onError);
  });
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
    client = null;
  }
}
