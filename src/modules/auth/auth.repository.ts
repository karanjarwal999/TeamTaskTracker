import type { Types } from 'mongoose';
import { User } from '@/db/models/user.model';
import { Membership } from '@/db/models/membership.model';

export const authRepository = {
  async findUserByEmail(email: string) {
    // Includes the (select:false) passwordHash — login/change-password need it.
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  },

  async findUserById(userId: string) {
    return User.findById(userId);
  },

  async userHasAnyMembership(userId: Types.ObjectId): Promise<boolean> {
    const hit = await Membership.exists({ userId });
    return hit !== null;
  },

  async attachFirebaseRegistration(userId: Types.ObjectId, firebaseUid: string) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { firebaseUid, isRegistered: true } },
      { new: true },
    );
  },

  async markRegistered(userId: Types.ObjectId) {
    return User.findByIdAndUpdate(userId, { $set: { isRegistered: true } }, { new: true });
  },

  async updatePasswordHash(userId: Types.ObjectId, passwordHash: string) {
    return User.findByIdAndUpdate(userId, { $set: { passwordHash } }, { new: true });
  },

  // Atomically bumps refreshTokenVersion only if the incoming version still matches.
  // Returns the updated user when bump succeeded; null when the version mismatched
  // (i.e., the token is stale because someone else already rotated).
  async bumpRefreshTokenVersionIfMatches(userId: string, expectedVersion: number) {
    return User.findOneAndUpdate(
      { _id: userId, refreshTokenVersion: expectedVersion },
      { $inc: { refreshTokenVersion: 1 } },
      { new: true },
    );
  },
};
