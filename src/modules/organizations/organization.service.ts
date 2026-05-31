import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { OrganizationDocument } from '@/db/models/organization.model';
import type { MembershipDocument } from '@/db/models/membership.model';
import { NotFoundError } from '@/shared/errors/domain-errors';
import { cacheService } from '@/shared/cache/cache.service';
import { organizationRepository } from './organization.repository';
import { ORG_LIST_CACHE_TTL_SECONDS, buildOrgListCacheKey } from './organization.constants';
import type {
  CreateOrganizationResult,
  OrganizationDto,
  MembershipDto,
  OrganizationWithRoleDto,
} from './organization.types';
import type { Role } from '@/shared/enums/role.enum';

interface OrganizationShape {
  _id: unknown;
  name: string;
  createdBy: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function orgToDto(
  doc: HydratedDocument<OrganizationDocument> | OrganizationShape,
): OrganizationDto {
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
        // self invite to org as ADMIN
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
      // The caller just got a new org → their listMine cache is stale.
      await cacheService.invalidate(buildOrgListCacheKey(userId));
      return result as CreateOrganizationResult;
    } finally {
      await session.endSession();
    }
  },

  async listMine(userId: string): Promise<OrganizationWithRoleDto[]> {
    const cacheKey = buildOrgListCacheKey(userId);
    const cached = await cacheService.get<OrganizationWithRoleDto[]>(cacheKey);
    if (cached) return cached;

    const rows = await organizationRepository.listOrganizationsForUser(userId);
    const result: OrganizationWithRoleDto[] = rows.map((row) => ({
      organization: orgToDto(row.organization as OrganizationShape),
      role: row.role,
    }));
    await cacheService.set(cacheKey, result, ORG_LIST_CACHE_TTL_SECONDS);
    return result;
  },

  async getById(organizationId: string): Promise<OrganizationDto> {
    const org = await organizationRepository.findOrganizationById(organizationId);
    if (!org) {
      throw new NotFoundError('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }
    return orgToDto(org as OrganizationShape);
  },
};
