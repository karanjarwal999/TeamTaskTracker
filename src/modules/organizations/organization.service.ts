import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { OrganizationDocument } from '@/db/models/organization.model';
import type { MembershipDocument } from '@/db/models/membership.model';
import { organizationRepository } from './organization.repository';
import type {
  CreateOrganizationResult,
  OrganizationDto,
  MembershipDto,
} from './organization.types';
import type { Role } from '@/shared/enums/role.enum';

function orgToDto(doc: HydratedDocument<OrganizationDocument>): OrganizationDto {
  return {
    id: String(doc._id),
    name: doc.name,
    createdBy: String(doc.createdBy),
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

function membershipToDto(doc: HydratedDocument<MembershipDocument>): MembershipDto {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    organizationId: String(doc.organizationId),
    role: doc.role as Role,
    invitedBy: String(doc.invitedBy),
    joinedAt: doc.joinedAt as Date,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export const organizationService = {
  async create(name: string, userId: string): Promise<CreateOrganizationResult> {
    const session = await mongoose.startSession();
    try {
      let result: CreateOrganizationResult | undefined;
      await session.withTransaction(async () => {
        const org = await organizationRepository.createOrganization(
          { name, createdBy: userId },
          session,
        );
        const membership = await organizationRepository.createFirstAdminMembership(
          { userId, organizationId: org._id, invitedBy: userId },
          session,
        );
        result = {
          organization: orgToDto(org),
          membership: membershipToDto(membership),
        };
      });
      // withTransaction guarantees the closure ran to completion if no error was thrown.
      return result as CreateOrganizationResult;
    } finally {
      await session.endSession();
    }
  },
};
