// === FIREBASE (DISABLED) ===
// Re-enable by uncommenting the two imports below and the Firebase blocks
// inside `login` and `changePassword`, then delete the DB-hash fallbacks.
// import { admin } from '@/config/firebase';
// import { firebaseAuth, FirebaseSignInError } from '@/shared/firebase/firebase-auth';
// === END FIREBASE ===
import { signAccess, signRefresh, verifyRefresh } from '@/shared/jwt/jwt.helper';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors/domain-errors';
import { hashPassword, verifyPassword } from '@/shared/utils/password';
import { authRepository } from './auth.repository';
import type { LoginResult, ChangePasswordResult, RefreshResult } from './auth.types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    // 1) Look up the local User record by email (includes passwordHash).
    let user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

    // 2) Verify credentials against the locally-stored hash.
    // === FIREBASE (DISABLED) ===
    // let signIn;
    // try {
    //   signIn = await firebaseAuth.signInWithPassword(email, password);
    // } catch (err) {
    //   if (err instanceof FirebaseSignInError) {
    //     throw new UnauthorizedError('INVALID_CREDENTIALS', 'Email or password is incorrect');
    //   }
    //   throw err;
    // }
    // === END FIREBASE ===
    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

    // 3) Confirm at least one Membership exists.
    const hasMembership = await authRepository.userHasAnyMembership(user._id);
    if (!hasMembership) {
      throw new ForbiddenError('USER_NOT_INVITED', 'User has no organization memberships');
    }

    // 4) First-login side effect: flip isRegistered.
    // === FIREBASE (DISABLED) ===
    // if (!user.firebaseUid || !user.isRegistered) {
    //   const updated = await authRepository.attachFirebaseRegistration(user._id, signIn.localId);
    //   if (updated) user = updated;
    // }
    // === END FIREBASE ===
    if (!user.isRegistered) {
      const updated = await authRepository.markRegistered(user._id);
      if (updated) user = updated;
    }

    const userIdStr = String(user._id);
    const accessToken = signAccess({ userId: userIdStr, email: user.email });
    const refreshToken = signRefresh({
      userId: userIdStr,
      refreshTokenVersion: user.refreshTokenVersion,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userIdStr,
        email: user.email,
        name: user.name,
        isRegistered: user.isRegistered,
      },
    };
  },

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    // 1) Look up the user and verify the current password against the stored hash.
    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Email or current password is incorrect');
    }

    // === FIREBASE (DISABLED) ===
    // let signIn;
    // try {
    //   signIn = await firebaseAuth.signInWithPassword(email, currentPassword);
    // } catch (err) {
    //   if (err instanceof FirebaseSignInError) {
    //     throw new UnauthorizedError(
    //       'INVALID_CREDENTIALS',
    //       'Email or current password is incorrect',
    //     );
    //   }
    //   throw err;
    // }
    // await admin.auth().updateUser(signIn.localId, { password: newPassword });
    // return { id: signIn.localId };
    // === END FIREBASE ===

    // 2) Replace the stored hash with one derived from newPassword.
    await authRepository.updatePasswordHash(user._id, hashPassword(newPassword));

    return { id: String(user._id) };
  },

  async refresh(refreshToken: string): Promise<RefreshResult> {
    // 1) Verify signature + expiry on the refresh token.
    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedError('REFRESH_TOKEN_INVALID', 'Refresh token is invalid or expired');
    }

    // 2) Atomically bump refreshTokenVersion only if the token's version still matches.
    // The atomicity prevents two concurrent refresh requests from both succeeding (one wins,
    // the other sees a stale version and is rejected).
    const updated = await authRepository.bumpRefreshTokenVersionIfMatches(
      payload.userId,
      payload.refreshTokenVersion,
    );
    if (!updated) {
      throw new UnauthorizedError(
        'REFRESH_TOKEN_INVALID',
        'Refresh token has been rotated or revoked',
      );
    }

    // 3) Issue a new access + refresh pair carrying the new version.
    const userIdStr = String(updated._id);
    const accessToken = signAccess({ userId: userIdStr, email: updated.email });
    const newRefreshToken = signRefresh({
      userId: userIdStr,
      refreshTokenVersion: updated.refreshTokenVersion,
    });
    return { accessToken, refreshToken: newRefreshToken };
  },
};
