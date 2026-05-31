import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '@/db/connection/mongo';
import { initFirebase, admin } from '@/config/firebase';
import { User } from '@/db/models/user.model';
import { Organization } from '@/db/models/organization.model';
import { Membership } from '@/db/models/membership.model';
import { Role } from '@/shared/enums/role.enum';
import { logger } from '@/shared/utils/logger';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'AdminPass#1234';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'System Admin';
const BOOTSTRAP_ORG_NAME = process.env.BOOTSTRAP_ORG_NAME ?? 'Bootstrap Organization';

async function ensureFirebaseUser(): Promise<string> {
  try {
    const existing = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    return existing.uid;
  } catch {
    const created = await admin.auth().createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      emailVerified: true,
    });
    return created.uid;
  }
}

async function run(): Promise<void> {
  initFirebase();
  await connectMongo();

  const firebaseUid = await ensureFirebaseUser();

  let user = await User.findOne({ email: ADMIN_EMAIL });
  if (!user) {
    user = await User.create({
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      firebaseUid,
      isRegistered: true,
    });
  } else if (!user.firebaseUid || !user.isRegistered) {
    user.firebaseUid = firebaseUid;
    user.isRegistered = true;
    await user.save();
  }

  let org = await Organization.findOne({ createdBy: user._id, name: BOOTSTRAP_ORG_NAME });
  if (!org) {
    org = await Organization.create({ name: BOOTSTRAP_ORG_NAME, createdBy: user._id });
  }

  const existingMembership = await Membership.findOne({
    userId: user._id,
    organizationId: org._id,
  });
  if (!existingMembership) {
    await Membership.create({
      userId: user._id,
      organizationId: org._id,
      role: Role.ADMIN,
      invitedBy: user._id,
      joinedAt: new Date(),
    });
  }

  logger.info('admin.seed.completed', {
    email: ADMIN_EMAIL,
    userId: String(user._id),
    organizationId: String(org._id),
  });
}

run()
  .catch((err) => {
    logger.error('admin.seed.failed', { err: String(err) });
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
    await mongoose.disconnect().catch(() => undefined);
    process.exit();
  });
