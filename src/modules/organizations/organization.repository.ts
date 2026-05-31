import type { ClientSession, Types } from 'mongoose';
import { Organization } from '@/db/models/organization.model';
import { Membership } from '@/db/models/membership.model';
import { Role } from '@/shared/enums/role.enum';

interface CreateOrganizationInput {
  name: string;
  createdBy: Types.ObjectId | string;
}

interface CreateFirstAdminMembershipInput {
  userId: Types.ObjectId | string;
  organizationId: Types.ObjectId | string;
  invitedBy: Types.ObjectId | string;
}

export interface MembershipWithOrganization {
  organization: {
    _id: Types.ObjectId;
    name: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };
  role: Role;
}

export const organizationRepository = {
  async createOrganization(input: CreateOrganizationInput, session: ClientSession) {
    const docs = await Organization.create([input], { session });
    return docs[0]!;
  },

  async createFirstAdminMembership(input: CreateFirstAdminMembershipInput, session: ClientSession) {
    const docs = await Membership.create([{ ...input, role: Role.ADMIN, joinedAt: new Date() }], {
      session,
    });
    return docs[0]!;
  },

  // Returns every org the user is a member of, paired with the user's role in that org.
  async listOrganizationsForUser(userId: string): Promise<MembershipWithOrganization[]> {
    // future option : This is simpler to read/maintain - we can have aggregate here instead of doing multiple queries + in-memory join.
    const memberships = await Membership.find({ userId }).lean();
    if (memberships.length === 0) return [];

    const orgIds = memberships.map((m) => m.organizationId);
    const orgs = await Organization.find({ _id: { $in: orgIds } }).lean();
    const orgById = new Map(orgs.map((o) => [String(o._id), o]));

    const out: MembershipWithOrganization[] = [];
    for (const m of memberships) {
      const org = orgById.get(String(m.organizationId));
      if (!org) continue; // org deleted out from under the membership — skip
      out.push({
        organization: {
          _id: org._id,
          name: org.name,
          createdBy: org.createdBy,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        },
        role: m.role as Role,
      });
    }
    return out;
  },

  async findOrganizationById(organizationId: string) {
    return Organization.findById(organizationId).lean();
  },
};
