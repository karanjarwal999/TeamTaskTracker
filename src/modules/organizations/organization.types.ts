import type { Role } from '@/shared/enums/role.enum';

export interface OrganizationDto {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipDto {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  invitedBy: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationResult {
  organization: OrganizationDto;
  membership: MembershipDto;
}

export interface OrganizationWithRoleDto {
  organization: OrganizationDto;
  role: Role;
}
