import type { ClientSession, Types } from 'mongoose';
import { Membership } from '@/db/models/membership.model';
import { User } from '@/db/models/user.model';
import type { Role } from '@/shared/enums/role.enum';
import type { CreateMembershipInput, MembershipWithUserRow } from './membership.types';

export const membershipRepository = {
  async findByUserAndOrg(userId: Types.ObjectId | string, organizationId: Types.ObjectId | string) {
    return Membership.findOne({ userId, organizationId }).lean();
  },

  async create(input: CreateMembershipInput, session: ClientSession) {
    const docs = await Membership.create([{ ...input, joinedAt: new Date() }], { session });
    return docs[0]!;
  },

  async listForOrganization(organizationId: string): Promise<MembershipWithUserRow[]> {
    // option : we can have aggragation here instead of two queries and mapping in JS.
    const memberships = await Membership.find({ organizationId }).lean();
    if (memberships.length === 0) return [];

    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select({ name: 1, email: 1 })
      .lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    const out: MembershipWithUserRow[] = [];
    for (const m of memberships) {
      const u = userById.get(String(m.userId));
      if (!u) continue; // user deleted out from under the membership — skip
      out.push({
        _id: m._id,
        userId: m.userId,
        organizationId: m.organizationId,
        role: m.role as Role,
        joinedAt: m.joinedAt ?? null,
        createdAt: m.createdAt,
        user: { name: u.name, email: u.email },
      });
    }
    return out;
  },
};
