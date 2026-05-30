import { Schema, model, type InferSchemaType } from 'mongoose';
import { toJSONOption } from '@/shared/utils/mongoose';

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: false },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isRegistered: { type: Boolean, default: false },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: toJSONOption,
  },
);

// sparse: only enforces uniqueness when firebaseUid is present (invited users may not have it yet).
userSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
