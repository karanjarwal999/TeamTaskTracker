import type { Types } from 'mongoose';
import type { Role } from '@/shared/enums/role.enum';
import type { UserSummaryDto } from '@/modules/users/user.types';
import type { MembershipDto } from '@/modules/organizations/organization.types';

// Repository input — payload accepted by membershipRepository.create.
export interface CreateMembershipInput {
  userId: Types.ObjectId | string;
  organizationId: Types.ObjectId | string;
  role: Role;
  invitedBy: Types.ObjectId | string;
}

export interface UpdateMembershipRoleInput {
  role: Role;
}

// Repository output — row returned by membershipRepository.listForOrganization,
// with the user's name + email joined in.
export interface MembershipWithUserRow {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  role: Role;
  joinedAt: Date | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}

export interface InviteResult {
  membership: MembershipDto;
  user: UserSummaryDto;
}

export interface MembershipWithUserDto {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  user: {
    name: string;
    email: string;
  };
  joinedAt: Date | null;
  createdAt: Date;
}

export type { MembershipDto, UserSummaryDto, Role };
