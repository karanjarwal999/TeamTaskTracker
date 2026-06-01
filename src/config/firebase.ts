import admin from 'firebase-admin';
import { env } from './env';

// NOTE: Firebase is currently disabled at the call-sites (server.ts, auth.service.ts,
// membership.service.ts, admin.seed.ts). The FIREBASE_* env vars are typed as
// optional; the `!` assertions below assume they'll be set again when Firebase is
// re-enabled.

let initialized = false;

export function initFirebase(): admin.app.App {
  if (initialized) {
    return admin.app();
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID!,
      clientEmail: env.FIREBASE_CLIENT_EMAIL!,
      privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });

  initialized = true;
  return app;
}

export { admin };
