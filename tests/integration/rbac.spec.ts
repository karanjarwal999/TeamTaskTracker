// FR-23 (a): MEMBER may not create tasks. The rbac middleware short-circuits
// before the service runs, returning 403 FORBIDDEN_ROLE.

import { buildUser, buildOrg, buildMembership, buildProject } from '../helpers/factory';
import { mintAccessToken } from '../helpers/auth.helper';
import { authedRequest } from '../helpers/request';
import { Role } from '@/shared/enums/role.enum';

describe('RBAC — MEMBER cannot create tasks', () => {
  it('returns 403 FORBIDDEN_ROLE when a MEMBER calls POST /tasks', async () => {
    const member = await buildUser();
    const org = await buildOrg(member._id);
    await buildMembership(member._id, org._id, Role.MEMBER);
    const project = await buildProject(org._id, member._id);

    const token = mintAccessToken(String(member._id), member.email);
    const req = authedRequest(token, String(org._id));

    const res = await req('post', '/tasks').send({
      title: 'Should be rejected',
      projectId: String(project._id),
    });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      code: 'FORBIDDEN_ROLE',
    });
  });
});
