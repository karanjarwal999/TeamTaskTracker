import { admin } from '@/config/firebase';
import { signAccess, signRefresh } from '@/shared/jwt/jwt.helper';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors/domain-errors';
import { firebaseAuth, FirebaseSignInError } from '@/shared/firebase/firebase-auth';
import { authRepository } from './auth.repository';
import type { LoginResult, ChangePasswordResult } from './auth.types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    // 1) Verify credentials with Firebase REST (signInWithPassword).
    let signIn;
    try {
      signIn = await firebaseAuth.signInWithPassword(email, password);
    } catch (err) {
      if (err instanceof FirebaseSignInError) {
        throw new UnauthorizedError('INVALID_CREDENTIALS', 'Email or password is incorrect');
      }
      throw err;
    }

    // 2) Look up the local User record by email.
    let user = await authRepository.findUserByEmail(signIn.email);
    if (!user) {
      // Firebase has the user, but our DB doesn't — treat as not-invited.
      throw new ForbiddenError('USER_NOT_INVITED', 'No invitation found for this email');
    }

    // 3) Confirm at least one Membership exists.
    const hasMembership = await authRepository.userHasAnyMembership(user._id);
    if (!hasMembership) {
      throw new ForbiddenError('USER_NOT_INVITED', 'User has no organization memberships');
    }

    // 4) First-login side effects: attach firebaseUid, flip isRegistered.
    if (!user.firebaseUid || !user.isRegistered) {
      const updated = await authRepository.attachFirebaseRegistration(user._id, signIn.localId);
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
    // 1) Verify current password by attempting a Firebase sign-in.
    let signIn;
    try {
      signIn = await firebaseAuth.signInWithPassword(email, currentPassword);
    } catch (err) {
      if (err instanceof FirebaseSignInError) {
        throw new UnauthorizedError(
          'INVALID_CREDENTIALS',
          'Email or current password is incorrect',
        );
      }
      throw err;
    }

    // 2) Update password in Firebase via Admin SDK (newPassword stays out of our DB).
    await admin.auth().updateUser(signIn.localId, { password: newPassword });

    return { id: signIn.localId };
  },
};
