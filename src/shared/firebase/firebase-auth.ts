import { env } from '@/config/env';

// Wraps Firebase Auth REST endpoint `signInWithPassword`.
// Single seam so tests can stub it without monkey-patching `fetch`.
//
// Docs: https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password

export interface SignInResult {
  localId: string; // Firebase UID
  email: string;
  idToken: string;
  refreshToken: string;
}

export class FirebaseSignInError extends Error {
  constructor(public readonly firebaseCode: string) {
    super(`Firebase REST signInWithPassword failed: ${firebaseCode}`);
  }
}

export const firebaseAuth = {
  async signInWithPassword(email: string, password: string): Promise<SignInResult> {
    // FIREBASE_API_KEY is optional in env (Firebase disabled); asserted here because
    // this function only runs when Firebase has been re-enabled at call-sites.
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(
      env.FIREBASE_API_KEY!,
    )}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const code =
        typeof json.error === 'object' &&
        json.error !== null &&
        'message' in json.error &&
        typeof (json.error as { message: unknown }).message === 'string'
          ? (json.error as { message: string }).message
          : 'UNKNOWN';
      throw new FirebaseSignInError(code);
    }

    return {
      localId: String(json.localId),
      email: String(json.email),
      idToken: String(json.idToken),
      refreshToken: String(json.refreshToken),
    };
  },
};
