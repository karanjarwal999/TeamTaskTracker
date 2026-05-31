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

export const organizationRepository = {
  // Model.create with an array + { session } is the documented Mongoose 8 shape
  // for associating a write with a transaction. Single-object form silently
  // detaches from the session.
  async createOrganization(input: CreateOrganizationInput, session: ClientSession) {
    // Model.create with a single-element input array always returns a one-element array;
    // the `!` is safe because the call would have thrown otherwise.
    const docs = await Organization.create([input], { session });
    return docs[0]!;
  },

  async createFirstAdminMembership(input: CreateFirstAdminMembershipInput, session: ClientSession) {
    const docs = await Membership.create([{ ...input, role: Role.ADMIN, joinedAt: new Date() }], {
      session,
    });
    return docs[0]!;
  },
};
