import type { ClientSession, Types } from 'mongoose';
import { User } from '@/db/models/user.model';

interface CreateUserInput {
  email: string;
  name: string;
  firebaseUid: string;
  isRegistered?: boolean;
  refreshTokenVersion?: number;
}

export const userRepository = {
  async findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() });
  },

  async findById(userId: string | Types.ObjectId) {
    return User.findById(userId);
  },

  async create(input: CreateUserInput, session: ClientSession) {
    const docs = await User.create(
      [
        {
          email: input.email.toLowerCase(),
          name: input.name,
          firebaseUid: input.firebaseUid,
          isRegistered: input.isRegistered ?? false,
          refreshTokenVersion: input.refreshTokenVersion ?? 0,
        },
      ],
      { session },
    );
    return docs[0]!;
  },

  async attachFirebaseUid(userId: Types.ObjectId | string, firebaseUid: string) {
    return User.findByIdAndUpdate(userId, { $set: { firebaseUid } }, { new: true });
  },

  async setRegistered(userId: Types.ObjectId | string, isRegistered: boolean) {
    return User.findByIdAndUpdate(userId, { $set: { isRegistered } }, { new: true });
  },
};
