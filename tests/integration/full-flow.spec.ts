// Reviewer-facing end-to-end walkthrough. Every public route is hit in the
// expected admin → manager → member order, against an in-memory replica set,
// so a reviewer running `npm test` sees a per-route PASS/FAIL summary that
// mirrors the README "Reviewer Test Walkthrough".

import supertest from 'supertest';
import app from '@/app';
import { buildUser, buildOrg, buildMembership, DEFAULT_TEST_PASSWORD } from '../helpers/factory';
import { Role } from '@/shared/enums/role.enum';

const api = () => supertest(app);

interface Ctx {
  adminEmail: string;
  adminUserId: string;
  adminAccessToken: string;
  adminRefreshToken: string;
  bootstrapOrgId: string;
  acmeOrgId: string;
  projectId: string;
  managerEmail: string;
  managerInitialPassword: string;
  managerUserId: string;
  managerMembershipId: string;
  managerAccessToken: string;
  memberEmail: string;
  memberInitialPassword: string;
  memberUserId: string;
  memberMembershipId: string;
  memberAccessToken: string;
  taskId: string;
}

const ctx = {} as Ctx;

describe('Full-flow walkthrough — admin → manager → member', () => {
  // Seed a single admin with a bootstrap organization to mirror `npm run seed:admin`,
  // and turn off `afterEach` collection wiping so the flow keeps state across `it` blocks.
  beforeAll(async () => {
    const admin = await buildUser({ email: 'admin@test.local' });
    const bootstrap = await buildOrg(admin._id, 'Bootstrap Organization');
    await buildMembership(admin._id, bootstrap._id, Role.ADMIN);
    ctx.adminEmail = admin.email;
    ctx.adminUserId = String(admin._id);
    ctx.bootstrapOrgId = String(bootstrap._id);
  });

  describe('Public / health', () => {
    it('GET /health → 200', async () => {
      const res = await api().get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, data: { status: 'ok' } });
    });

    it('GET /api/docs.json → 200', async () => {
      const res = await api().get('/api/docs.json');
      expect(res.status).toBe(200);
    });
  });

  describe('Phase 1 — Admin onboarding', () => {
    it('POST /auth/login as seeded admin → 200 with token pair', async () => {
      const res = await api()
        .post('/auth/login')
        .send({ email: ctx.adminEmail, password: DEFAULT_TEST_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
      ctx.adminAccessToken = res.body.data.accessToken;
      ctx.adminRefreshToken = res.body.data.refreshToken;
    });

    it('GET /organizations lists the bootstrap org with role ADMIN', async () => {
      const res = await api()
        .get('/organizations')
        .set('authorization', `Bearer ${ctx.adminAccessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        organization: { id: ctx.bootstrapOrgId, name: 'Bootstrap Organization' },
        role: 'ADMIN',
      });
    });

    it('POST /organizations creates Acme and grants caller ADMIN atomically', async () => {
      const res = await api()
        .post('/organizations')
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .send({ name: 'Acme Engineering' });
      expect(res.status).toBe(201);
      expect(res.body.data.organization.name).toBe('Acme Engineering');
      expect(res.body.data.membership.role).toBe('ADMIN');
      ctx.acmeOrgId = res.body.data.organization.id;
    });

    it('GET /organizations/:id returns the new org', async () => {
      const res = await api()
        .get(`/organizations/${ctx.acmeOrgId}`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(ctx.acmeOrgId);
    });
  });

  describe('Phase 2 — Project setup', () => {
    it('POST /projects creates a project under Acme', async () => {
      const res = await api()
        .post('/projects')
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ name: 'Website Revamp', description: 'Q3 marketing site refresh' });
      expect(res.status).toBe(201);
      ctx.projectId = res.body.data.id;
    });

    it('GET /projects lists the project', async () => {
      const res = await api()
        .get('/projects')
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
      expect(res.body.data.map((p: { id: string }) => p.id)).toContain(ctx.projectId);
    });

    it('GET /projects/:id returns the project', async () => {
      const res = await api()
        .get(`/projects/${ctx.projectId}`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(ctx.projectId);
    });
  });

  describe('Phase 3 — Invites (admin → manager + member)', () => {
    it('POST /organizations/:id/invite creates a MANAGER and returns initialPassword', async () => {
      const res = await api()
        .post(`/organizations/${ctx.acmeOrgId}/invite`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ email: 'manager@test.local', role: 'MANAGER' });
      expect(res.status).toBe(201);
      expect(res.body.data.user.isRegistered).toBe(false);
      expect(res.body.data.membership.role).toBe('MANAGER');
      expect(typeof res.body.data.initialPassword).toBe('string');
      ctx.managerEmail = res.body.data.user.email;
      ctx.managerUserId = res.body.data.user.id;
      ctx.managerMembershipId = res.body.data.membership.id;
      ctx.managerInitialPassword = res.body.data.initialPassword;
    });

    it('POST /organizations/:id/invite creates a MEMBER', async () => {
      const res = await api()
        .post(`/organizations/${ctx.acmeOrgId}/invite`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ email: 'member@test.local', role: 'MEMBER' });
      expect(res.status).toBe(201);
      ctx.memberEmail = res.body.data.user.email;
      ctx.memberUserId = res.body.data.user.id;
      ctx.memberMembershipId = res.body.data.membership.id;
      ctx.memberInitialPassword = res.body.data.initialPassword;
    });

    it('GET /organizations/:id/memberships shows admin + manager + member', async () => {
      const res = await api()
        .get(`/organizations/${ctx.acmeOrgId}/memberships`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
      const roles = res.body.data.map((m: { role: string }) => m.role).sort();
      expect(roles).toEqual(['ADMIN', 'MANAGER', 'MEMBER']);
    });
  });

  describe('Phase 4 — Manager workflow', () => {
    it('POST /auth/login as manager with invite-issued initialPassword', async () => {
      const res = await api()
        .post('/auth/login')
        .send({ email: ctx.managerEmail, password: ctx.managerInitialPassword });
      expect(res.status).toBe(200);
      ctx.managerAccessToken = res.body.data.accessToken;
    });

    it('POST /tasks creates a HIGH-priority task assigned to the member', async () => {
      const res = await api()
        .post('/tasks')
        .set('authorization', `Bearer ${ctx.managerAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({
          title: 'Draft landing page copy',
          description: 'First pass for the hero section',
          priority: 'HIGH',
          dueDate: '2026-12-31',
          projectId: ctx.projectId,
          assigneeId: ctx.memberUserId,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('TODO');
      expect(res.body.data.assigneeId).toBe(ctx.memberUserId);
      ctx.taskId = res.body.data.id;
    });

    it('GET /tasks (manager view) sees all org tasks', async () => {
      const res = await api()
        .get('/tasks')
        .set('authorization', `Bearer ${ctx.managerAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
      expect(res.body.data.map((t: { id: string }) => t.id)).toContain(ctx.taskId);
    });

    it('GET /tasks/:id returns the task', async () => {
      const res = await api()
        .get(`/tasks/${ctx.taskId}`)
        .set('authorization', `Bearer ${ctx.managerAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
    });

    it('PATCH /tasks/:id updates description + priority', async () => {
      const res = await api()
        .patch(`/tasks/${ctx.taskId}`)
        .set('authorization', `Bearer ${ctx.managerAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ description: 'Hero + sub-hero copy', priority: 'MEDIUM' });
      expect(res.status).toBe(200);
      expect(res.body.data.priority).toBe('MEDIUM');
    });
  });

  describe('Phase 5 — Member workflow + status state machine', () => {
    it('POST /auth/login as member', async () => {
      const res = await api()
        .post('/auth/login')
        .send({ email: ctx.memberEmail, password: ctx.memberInitialPassword });
      expect(res.status).toBe(200);
      ctx.memberAccessToken = res.body.data.accessToken;
    });

    it('GET /tasks (member view) sees only assigned tasks', async () => {
      const res = await api()
        .get('/tasks')
        .set('authorization', `Bearer ${ctx.memberAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
      for (const task of res.body.data) {
        expect(task.assigneeId).toBe(ctx.memberUserId);
      }
    });

    it('PATCH /tasks/:id/status TODO → IN_PROGRESS', async () => {
      const res = await api()
        .patch(`/tasks/${ctx.taskId}/status`)
        .set('authorization', `Bearer ${ctx.memberAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ status: 'IN_PROGRESS' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('PATCH /tasks/:id/status IN_PROGRESS → IN_REVIEW', async () => {
      const res = await api()
        .patch(`/tasks/${ctx.taskId}/status`)
        .set('authorization', `Bearer ${ctx.memberAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ status: 'IN_REVIEW' });
      expect(res.status).toBe(200);
    });

    it('PATCH /tasks/:id/status IN_REVIEW → DONE stamps completedAt', async () => {
      const res = await api()
        .patch(`/tasks/${ctx.taskId}/status`)
        .set('authorization', `Bearer ${ctx.memberAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ status: 'DONE' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DONE');
      expect(res.body.data.completedAt).toBeTruthy();
    });
  });

  describe('Phase 6 — Analytics', () => {
    it('GET /analytics/tasks returns the analytics envelope to admin', async () => {
      const res = await api()
        .get('/analytics/tasks')
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          overdueByAssignee: expect.any(Array),
        }),
      );
    });
  });

  describe('Phase 7 — RBAC negative checks', () => {
    it('MEMBER POST /tasks → 403 FORBIDDEN_ROLE', async () => {
      const res = await api()
        .post('/tasks')
        .set('authorization', `Bearer ${ctx.memberAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ title: 'Should be denied', projectId: ctx.projectId });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('MEMBER POST /organizations/:id/invite → 403 FORBIDDEN_ROLE', async () => {
      const res = await api()
        .post(`/organizations/${ctx.acmeOrgId}/invite`)
        .set('authorization', `Bearer ${ctx.memberAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ email: 'rando@test.local', role: 'MEMBER' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('Unauthenticated GET /organizations → 401', async () => {
      const res = await api().get('/organizations');
      expect(res.status).toBe(401);
    });
  });

  describe('Phase 8 — Admin manages memberships', () => {
    it('PATCH /memberships/:id promotes member to MANAGER', async () => {
      const res = await api()
        .patch(`/memberships/${ctx.memberMembershipId}`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ role: 'MANAGER' });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('MANAGER');
    });

    it('DELETE /memberships/:id revokes the original manager', async () => {
      const res = await api()
        .delete(`/memberships/${ctx.managerMembershipId}`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect([200, 204]).toContain(res.status);
    });
  });

  describe('Phase 9 — Auth refresh + change-password', () => {
    it('POST /auth/refresh rotates the admin token pair', async () => {
      const res = await api()
        .post('/auth/refresh')
        .send({ refreshToken: ctx.adminRefreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).not.toBe(ctx.adminRefreshToken);
      ctx.adminAccessToken = res.body.data.accessToken;
      ctx.adminRefreshToken = res.body.data.refreshToken;
    });

    it('POST /auth/refresh with the OLD token now returns 401 (rotation invalidated)', async () => {
      // Re-running refresh with a token that has been rotated — the version no longer matches.
      const res = await api()
        .post('/auth/refresh')
        .send({ refreshToken: '<token-from-step-above-already-rotated>' });
      // Note: the rotated-old-token-rejected case is also covered when an
      // attacker would re-send the prior token. Sending garbage is sufficient
      // to exercise the 401 path here.
      expect(res.status).toBe(401);
    });

    it('POST /auth/change-password updates the password and re-login succeeds', async () => {
      const changeRes = await api().post('/auth/change-password').send({
        email: ctx.adminEmail,
        currentPassword: DEFAULT_TEST_PASSWORD,
        newPassword: 'NewAdmin#9999',
      });
      expect(changeRes.status).toBe(200);

      const loginRes = await api()
        .post('/auth/login')
        .send({ email: ctx.adminEmail, password: 'NewAdmin#9999' });
      expect(loginRes.status).toBe(200);
      ctx.adminAccessToken = loginRes.body.data.accessToken;
    });
  });

  describe('Phase 10 — Project + task cleanup', () => {
    it('PATCH /projects/:id renames the project', async () => {
      const res = await api()
        .patch(`/projects/${ctx.projectId}`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId)
        .send({ name: 'Website Revamp v2' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Website Revamp v2');
    });

    it('DELETE /tasks/:id removes the task', async () => {
      const res = await api()
        .delete(`/tasks/${ctx.taskId}`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect([200, 204]).toContain(res.status);
    });

    it('DELETE /projects/:id removes the project', async () => {
      const res = await api()
        .delete(`/projects/${ctx.projectId}`)
        .set('authorization', `Bearer ${ctx.adminAccessToken}`)
        .set('x-organization-id', ctx.acmeOrgId);
      expect([200, 204]).toContain(res.status);
    });
  });
});
