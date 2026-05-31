import type { Request, Response } from 'express';
import { successResponse, noContentResponse } from '@/shared/helpers/response.helper';
import { NotFoundError } from '@/shared/errors/domain-errors';
import { membershipService } from './membership.service';
import type { InviteBody, UpdateRoleBody } from './membership.validation';
import type { Role } from '@/shared/enums/role.enum';

export const membershipController = {
  async invite(req: Request, res: Response): Promise<void> {
    const paramId = req.params.id;
    const contextId = req.membership!.organizationId;
    if (paramId !== contextId) {
      throw new NotFoundError('ORGANIZATION_NOT_FOUND', 'Organization not found in this context');
    }

    const body = req.body as InviteBody;
    const invitedBy = req.user!.userId;
    const result = await membershipService.invite(
      contextId,
      body.email,
      body.role as Role,
      invitedBy,
    );
    successResponse(res, 'Invite dispatched', result, 201);
  },

  async listForOrganization(req: Request, res: Response): Promise<void> {
    const paramId = req.params.id;
    const contextId = req.membership!.organizationId;
    if (paramId !== contextId) {
      throw new NotFoundError('ORGANIZATION_NOT_FOUND', 'Organization not found in this context');
    }
    const data = await membershipService.listForOrganization(contextId);
    successResponse(res, 'Memberships', data);
  },

  async updateRole(req: Request, res: Response): Promise<void> {
    const membershipId = req.params.id as string;
    const contextOrgId = req.membership!.organizationId;
    const { role } = req.body as UpdateRoleBody;
    const updated = await membershipService.updateRole(membershipId, contextOrgId, role as Role);
    successResponse(res, 'Membership role updated', updated);
  },

  async revoke(req: Request, res: Response): Promise<void> {
    const membershipId = req.params.id as string;
    const contextOrgId = req.membership!.organizationId;
    await membershipService.revoke(membershipId, contextOrgId);
    noContentResponse(res);
  },
};
