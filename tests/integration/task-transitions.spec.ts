// FR-23 (b): a task in TODO cannot jump straight to DONE. The transition
// state machine in task.transitions.ts rejects it with 422 INVALID_TRANSITION.

import { buildUser, buildOrg, buildMembership, buildProject, buildTask } from '../helpers/factory';
import { mintAccessToken } from '../helpers/auth.helper';
import { authedRequest } from '../helpers/request';
import { Role } from '@/shared/enums/role.enum';
import { TaskStatus } from '@/shared/enums/task-status.enum';

describe('Task transitions — TODO → DONE is rejected', () => {
  it('returns 422 INVALID_TRANSITION when PATCHing status straight from TODO to DONE', async () => {
    const manager = await buildUser();
    const org = await buildOrg(manager._id);
    await buildMembership(manager._id, org._id, Role.MANAGER);
    const project = await buildProject(org._id, manager._id);
    const task = await buildTask(org._id, project._id, manager._id, {
      status: TaskStatus.TODO,
    });

    const token = mintAccessToken(String(manager._id), manager.email);
    const req = authedRequest(token, String(org._id));

    const res = await req('patch', `/tasks/${String(task._id)}/status`).send({
      status: TaskStatus.DONE,
    });

    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      success: false,
      code: 'INVALID_TRANSITION',
    });
  });
});
