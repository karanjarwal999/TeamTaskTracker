import admin from 'firebase-admin';
import { env } from './env';

let initialized = false;

export function initFirebase(): admin.app.App {
  if (initialized) {
    return admin.app();
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  initialized = true;
  return app;
}

export { admin };
