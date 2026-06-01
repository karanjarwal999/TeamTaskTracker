import { randomInt } from 'crypto';
import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
// === FIREBASE (DISABLED) ===
// Re-enable by uncommenting and restoring the Firebase block inside `invite`.
// import { admin } from '@/config/firebase';
// === END FIREBASE ===
import { ConflictError, NotFoundError } from '@/shared/errors/domain-errors';
import { logger } from '@/shared/utils/logger';
import { cacheService } from '@/shared/cache/cache.service';
import { hashPassword } from '@/shared/utils/password';
import { buildOrgListCacheKey } from '@/modules/organizations/organization.constants';
import { userRepository } from '@/modules/users/user.repository';
import { membershipRepository } from './membership.repository';
import { INITIAL_PASSWORD_ALPHABET, INITIAL_PASSWORD_LENGTH } from './membership.constants';
import type {
  InviteResult,
  MembershipDto,
  MembershipWithUserDto,
  UserSummaryDto,
} from './membership.types';
import type { Role } from '@/shared/enums/role.enum';
import type { UserDocument } from '@/db/models/user.model';
import type { MembershipDocument } from '@/db/models/membership.model';

function generateInitialPassword(): string {
  let out = '';
  for (let i = 0; i < INITIAL_PASSWORD_LENGTH; i++) {
    out += INITIAL_PASSWORD_ALPHABET[randomInt(0, INITIAL_PASSWORD_ALPHABET.length)];
  }
  return out;
}

// === FIREBASE (DISABLED) ===
// function isFirebaseEmailAlreadyExists(err: unknown): boolean {
//   return (
//     typeof err === 'object' &&
//     err !== null &&
//     'code' in err &&
//     (err as { code: unknown }).code === 'auth/email-already-exists'
//   );
// }
// === END FIREBASE ===

function userToSummary(doc: HydratedDocument<UserDocument>): UserSummaryDto {
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name,
    isRegistered: doc.isRegistered ?? false,
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

export const membershipService = {
  async invite(
    organizationId: string,
    email: string,
    role: Role,
    invitedBy: string,
  ): Promise<InviteResult> {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await userRepository.findByEmail(normalizedEmail);

    // Branch B: User already exists in our DB — Firebase user must already exist too;
    if (existingUser) {
      const existingMembership = await membershipRepository.findByUserAndOrg(
        existingUser._id,
        organizationId,
      );
      if (existingMembership) {
        throw new ConflictError(
          'MEMBERSHIP_EXISTS',
          'User is already a member of this organization',
        );
      }

      const session = await mongoose.startSession();
      try {
        let membership: HydratedDocument<MembershipDocument> | undefined;
        await session.withTransaction(async () => {
          membership = await membershipRepository.create(
            { userId: existingUser._id, organizationId, role, invitedBy },
            session,
          );
        });
        logger.info('invite.dispatched', {
          email: normalizedEmail,
          role,
          organizationId,
          initialPassword: null,
        });
        // The invitee just gained a new org membership → their listMine is stale.
        await cacheService.invalidate(buildOrgListCacheKey(String(existingUser._id)));
        return {
          membership: membershipToDto(membership!),
          user: userToSummary(existingUser),
          initialPassword: null,
        };
      } finally {
        await session.endSession();
      }
    }

    // Branch A: No local User. Generate an initial password, hash it, and create local records.
    const initialPassword: string = generateInitialPassword();
    const passwordHash = hashPassword(initialPassword);

    // === FIREBASE (DISABLED) ===
    // let firebaseUid: string;
    // let initialPassword: string | null = generateInitialPassword();
    // try {
    //   const fbUser = await admin.auth().createUser({
    //     email: normalizedEmail,
    //     password: initialPassword,
    //     emailVerified: false,
    //   });
    //   firebaseUid = fbUser.uid;
    // } catch (err) {
    //   if (isFirebaseEmailAlreadyExists(err)) {
    //     // Partial-state recovery: Firebase already has this user (no local record).
    //     const fbUser = await admin.auth().getUserByEmail(normalizedEmail);
    //     firebaseUid = fbUser.uid;
    //     initialPassword = null;
    //   } else {
    //     throw err;
    //   }
    // }
    // === END FIREBASE ===

    const session = await mongoose.startSession();
    try {
      let createdUser: HydratedDocument<UserDocument> | undefined;
      let createdMembership: HydratedDocument<MembershipDocument> | undefined;
      await session.withTransaction(async () => {
        createdUser = await userRepository.create(
          { email: normalizedEmail, name: normalizedEmail, passwordHash },
          session,
        );
        createdMembership = await membershipRepository.create(
          { userId: createdUser._id, organizationId, role, invitedBy },
          session,
        );
      });
      logger.info('invite.dispatched', {
        email: normalizedEmail,
        role,
        organizationId,
        initialPassword,
      });
      // New invitee — their listMine cache (if any pre-warmed) is now stale.
      await cacheService.invalidate(buildOrgListCacheKey(String(createdUser!._id)));
      return {
        membership: membershipToDto(createdMembership!),
        user: userToSummary(createdUser!),
        initialPassword,
      };
    } finally {
      await session.endSession();
    }
  },

  async listForOrganization(organizationId: string): Promise<MembershipWithUserDto[]> {
    const rows = await membershipRepository.listForOrganization(organizationId);
    return rows.map((r) => ({
      id: String(r._id),
      userId: String(r.userId),
      organizationId: String(r.organizationId),
      role: r.role,
      user: { name: r.user.name, email: r.user.email },
      joinedAt: r.joinedAt,
      createdAt: r.createdAt,
    }));
  },

  async updateRole(
    membershipId: string,
    organizationId: string,
    role: Role,
  ): Promise<MembershipDto> {
    const updated = await membershipRepository.updateRoleInOrg(membershipId, organizationId, {
      role,
    });
    if (!updated) {
      throw new NotFoundError('MEMBERSHIP_NOT_FOUND', 'Membership not found in this organization');
    }
    // The affected user's listMine returns role-per-org; that role just changed.
    await cacheService.invalidate(buildOrgListCacheKey(String(updated.userId)));
    return membershipToDto(updated);
  },

  async revoke(membershipId: string, organizationId: string): Promise<void> {
    const deleted = await membershipRepository.deleteByIdInOrg(membershipId, organizationId);
    if (!deleted) {
      throw new NotFoundError('MEMBERSHIP_NOT_FOUND', 'Membership not found in this organization');
    }
    // The revoked user just lost an org → drop their cached listMine.
    await cacheService.invalidate(buildOrgListCacheKey(String(deleted.userId)));
  },
};
