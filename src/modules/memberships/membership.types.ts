import type { Role } from '@/shared/enums/role.enum';
import type { UserSummaryDto } from '@/modules/users/user.types';
import type { MembershipDto } from '@/modules/organizations/organization.types';

export interface InviteResult {
  membership: MembershipDto;
  user: UserSummaryDto;
}

export type { MembershipDto, UserSummaryDto, Role };
