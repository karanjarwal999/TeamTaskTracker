import type { ClientSession, Types } from 'mongoose';
import { Membership } from '@/db/models/membership.model';
import type { Role } from '@/shared/enums/role.enum';

interface CreateMembershipInput {
  userId: Types.ObjectId | string;
  organizationId: Types.ObjectId | string;
  role: Role;
  invitedBy: Types.ObjectId | string;
}

export const membershipRepository = {
  async findByUserAndOrg(userId: Types.ObjectId | string, organizationId: Types.ObjectId | string) {
    return Membership.findOne({ userId, organizationId }).lean();
  },

  async create(input: CreateMembershipInput, session: ClientSession) {
    const docs = await Membership.create([{ ...input, joinedAt: new Date() }], { session });
    return docs[0]!;
  },
};
