import type { Types } from 'mongoose';
import { User } from '@/db/models/user.model';
import { Membership } from '@/db/models/membership.model';

export const authRepository = {
  async findUserByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() });
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
};
