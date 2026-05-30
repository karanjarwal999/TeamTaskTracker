import { Schema, model, type InferSchemaType } from 'mongoose';
import { ROLE_VALUES } from '@/shared/enums/role.enum';
import { toJSONOption } from '@/shared/utils/mongoose';

const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    role: { type: String, enum: ROLE_VALUES, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    joinedAt: { type: Date, required: false },
  },
  {
    timestamps: true,
    toJSON: toJSONOption,
  },
);

// One membership per (user, organization) — prevents duplicate invites silently re-attaching.
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export type MembershipDocument = InferSchemaType<typeof membershipSchema>;
export const Membership = model('Membership', membershipSchema);
