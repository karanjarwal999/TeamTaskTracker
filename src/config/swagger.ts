import 'zod-openapi/extend';
import { z } from 'zod';
import type { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createDocument, type ZodOpenApiPathsObject } from 'zod-openapi';

import { ROLE_VALUES } from '@/shared/enums/role.enum';
import { TASK_STATUS_VALUES } from '@/shared/enums/task-status.enum';
import { TASK_PRIORITY_VALUES } from '@/shared/enums/task-priority.enum';

// Request-body schemas live in `*.validation.ts` (the same Zod schemas runtime
// validation uses). Re-import here so paths can reference them by Zod identity.
import { loginSchema, changePasswordSchema, refreshSchema } from '@/modules/auth/auth.validation';
import { createOrganizationSchema } from '@/modules/organizations/organization.validation';
import { inviteSchema, updateRoleSchema } from '@/modules/memberships/membership.validation';
import { createProjectSchema, updateProjectSchema } from '@/modules/projects/project.validation';
import {
  createTaskSchema,
  updateTaskSchema,
  transitionStatusSchema,
} from '@/modules/tasks/task.validation';

// ─── Response DTO schemas (Zod) ──────────────────────────────────────────────
// These describe API outputs so the OpenAPI spec has concrete response shapes.
// The TypeScript interfaces in `*.types.ts` and these Zod schemas describe the
// same shape; we keep both because converting every DTO to Zod would touch
// every service.

const RoleEnum = z.enum(ROLE_VALUES as [string, ...string[]]).openapi({ ref: 'Role' });
const TaskStatusEnum = z
  .enum(TASK_STATUS_VALUES as [string, ...string[]])
  .openapi({ ref: 'TaskStatus' });
const TaskPriorityEnum = z
  .enum(TASK_PRIORITY_VALUES as [string, ...string[]])
  .openapi({ ref: 'TaskPriority' });

const PaginationSchema = z
  .object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
  .openapi({ ref: 'Pagination' });

const ErrorEnvelopeSchema = z
  .object({
    success: z.literal(false),
    status: z.number().int(),
    code: z.string(),
    message: z.string(),
  })
  .openapi({ ref: 'ErrorEnvelope' });

const UserSummarySchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    isRegistered: z.boolean(),
  })
  .openapi({ ref: 'UserSummary' });

const OrganizationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi({ ref: 'Organization' });

const MembershipSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    organizationId: z.string(),
    role: RoleEnum,
    invitedBy: z.string(),
    joinedAt: z.string().datetime(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi({ ref: 'Membership' });

const MembershipWithUserSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    organizationId: z.string(),
    role: RoleEnum,
    user: z.object({ name: z.string(), email: z.string().email() }),
    joinedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi({ ref: 'MembershipWithUser' });

const ProjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    organizationId: z.string(),
    createdBy: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi({ ref: 'Project' });

const TaskSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: TaskPriorityEnum,
    status: TaskStatusEnum,
    assigneeId: z.string().optional(),
    projectId: z.string(),
    organizationId: z.string(),
    dueDate: z.string().datetime().optional(),
    createdBy: z.string(),
    updatedBy: z.string().optional(),
    completedAt: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi({ ref: 'Task' });

const TaskAnalyticsSchema = z
  .object({
    overdueByAssignee: z.array(z.object({ userId: z.string(), count: z.number().int() })),
    averageCompletionTimeMs: z.number().nullable(),
  })
  .openapi({ ref: 'TaskAnalytics' });

// Envelope helpers — every success response uses { success, message, data, pagination? }.
const successOf = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), message: z.string(), data: dataSchema });

const paginatedOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.array(itemSchema),
    pagination: PaginationSchema,
  });

// Common error responses — referenced from individual paths to avoid repetition.
const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorEnvelopeSchema } },
});
const Unauthorized = errorResponse('Missing or invalid access token.');
const Forbidden = errorResponse('Authenticated, but role/membership disallows this action.');
const NotFound = errorResponse('Resource not found in this organization context.');
const Validation = errorResponse('Validation or workflow rule violation.');
const Conflict = errorResponse('Conflict with existing resource.');

// ─── Paths ───────────────────────────────────────────────────────────────────

const paths: ZodOpenApiPathsObject = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Log in with email + password',
      security: [],
      requestBody: { content: { 'application/json': { schema: loginSchema } } },
      responses: {
        '200': {
          description: 'Logged in.',
          content: {
            'application/json': {
              schema: successOf(
                z.object({
                  accessToken: z.string(),
                  refreshToken: z.string(),
                  user: UserSummarySchema,
                }),
              ),
            },
          },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '422': Validation,
      },
    },
  },
  '/auth/change-password': {
    post: {
      tags: ['Auth'],
      summary: 'Change Firebase password',
      security: [],
      requestBody: { content: { 'application/json': { schema: changePasswordSchema } } },
      responses: {
        '200': {
          description: 'Password updated.',
          content: { 'application/json': { schema: successOf(z.object({ id: z.string() })) } },
        },
        '401': Unauthorized,
        '422': Validation,
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Rotate refresh token',
      security: [],
      requestBody: { content: { 'application/json': { schema: refreshSchema } } },
      responses: {
        '200': {
          description: 'New token pair issued.',
          content: {
            'application/json': {
              schema: successOf(z.object({ accessToken: z.string(), refreshToken: z.string() })),
            },
          },
        },
        '401': Unauthorized,
        '422': Validation,
      },
    },
  },

  // ── Organizations ─────────────────────────────────────────────────────────
  '/organizations': {
    post: {
      tags: ['Organizations'],
      summary: 'Create organization (caller becomes first ADMIN)',
      security: [{ bearerAuth: [] }],
      requestBody: { content: { 'application/json': { schema: createOrganizationSchema } } },
      responses: {
        '201': {
          description: 'Organization created.',
          content: {
            'application/json': {
              schema: successOf(
                z.object({ organization: OrganizationSchema, membership: MembershipSchema }),
              ),
            },
          },
        },
        '401': Unauthorized,
        '422': Validation,
      },
    },
    get: {
      tags: ['Organizations'],
      summary: 'List my organizations',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of {organization, role} pairs.',
          content: {
            'application/json': {
              schema: successOf(
                z.array(z.object({ organization: OrganizationSchema, role: RoleEnum })),
              ),
            },
          },
        },
        '401': Unauthorized,
      },
    },
  },
  '/organizations/{id}': {
    get: {
      tags: ['Organizations'],
      summary: 'Get a single organization by id',
      requestParams: { path: z.object({ id: z.string() }) },
      responses: {
        '200': {
          description: 'Organization.',
          content: { 'application/json': { schema: successOf(OrganizationSchema) } },
        },
        '400': errorResponse('x-organization-id header missing or malformed.'),
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
      },
    },
  },
  '/organizations/{id}/invite': {
    post: {
      tags: ['Memberships'],
      summary: 'Invite a user to the organization (ADMIN only)',
      requestParams: { path: z.object({ id: z.string() }) },
      requestBody: { content: { 'application/json': { schema: inviteSchema } } },
      responses: {
        '201': {
          description: 'Invite dispatched.',
          content: {
            'application/json': {
              schema: successOf(
                z.object({ membership: MembershipSchema, user: UserSummarySchema }),
              ),
            },
          },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
        '409': Conflict,
        '422': Validation,
      },
    },
  },
  '/organizations/{id}/memberships': {
    get: {
      tags: ['Memberships'],
      summary: 'List memberships in the organization (any role)',
      requestParams: { path: z.object({ id: z.string() }) },
      responses: {
        '200': {
          description: 'List of memberships with user name + email.',
          content: { 'application/json': { schema: successOf(z.array(MembershipWithUserSchema)) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
      },
    },
  },

  // ── Memberships ───────────────────────────────────────────────────────────
  '/memberships/{id}': {
    patch: {
      tags: ['Memberships'],
      summary: 'Update membership role (ADMIN only)',
      requestParams: { path: z.object({ id: z.string() }) },
      requestBody: { content: { 'application/json': { schema: updateRoleSchema } } },
      responses: {
        '200': {
          description: 'Updated membership.',
          content: { 'application/json': { schema: successOf(MembershipSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
        '422': Validation,
      },
    },
    delete: {
      tags: ['Memberships'],
      summary: 'Revoke membership (ADMIN only)',
      requestParams: { path: z.object({ id: z.string() }) },
      responses: {
        '204': { description: 'Membership revoked.' },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
      },
    },
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  '/projects': {
    post: {
      tags: ['Projects'],
      summary: 'Create a project (ADMIN/MANAGER only)',
      requestBody: { content: { 'application/json': { schema: createProjectSchema } } },
      responses: {
        '201': {
          description: 'Project created.',
          content: { 'application/json': { schema: successOf(ProjectSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '422': Validation,
      },
    },
    get: {
      tags: ['Projects'],
      summary: 'List projects in the org (paginated)',
      requestParams: {
        query: z.object({
          page: z.coerce.number().int().positive().optional(),
          limit: z.coerce.number().int().positive().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Paginated list of projects.',
          content: { 'application/json': { schema: paginatedOf(ProjectSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
      },
    },
  },
  '/projects/{id}': {
    get: {
      tags: ['Projects'],
      summary: 'Get a project by id (any role)',
      requestParams: { path: z.object({ id: z.string() }) },
      responses: {
        '200': {
          description: 'Project.',
          content: { 'application/json': { schema: successOf(ProjectSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
      },
    },
    patch: {
      tags: ['Projects'],
      summary: 'Update project (ADMIN/MANAGER only)',
      requestParams: { path: z.object({ id: z.string() }) },
      requestBody: { content: { 'application/json': { schema: updateProjectSchema } } },
      responses: {
        '200': {
          description: 'Updated project.',
          content: { 'application/json': { schema: successOf(ProjectSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
        '422': Validation,
      },
    },
    delete: {
      tags: ['Projects'],
      summary: 'Delete project (ADMIN/MANAGER only, hard delete)',
      requestParams: { path: z.object({ id: z.string() }) },
      responses: {
        '204': { description: 'Project deleted.' },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
      },
    },
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  '/tasks': {
    post: {
      tags: ['Tasks'],
      summary: 'Create a task (ADMIN/MANAGER only)',
      requestBody: { content: { 'application/json': { schema: createTaskSchema } } },
      responses: {
        '201': {
          description: 'Task created.',
          content: { 'application/json': { schema: successOf(TaskSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
        '422': Validation,
      },
    },
    get: {
      tags: ['Tasks'],
      summary: 'List tasks with filters / sort / pagination',
      description:
        'ADMIN/MANAGER see all org tasks; MEMBER sees only tasks assigned to them (role-scope overrides any inbound `assigneeId`). Redis-cached (60s).',
      requestParams: {
        query: z.object({
          status: TaskStatusEnum.optional(),
          priority: TaskPriorityEnum.optional(),
          assigneeId: z.string().optional(),
          projectId: z.string().optional(),
          dueBefore: z.string().datetime().optional(),
          dueAfter: z.string().datetime().optional(),
          sortBy: z.enum(['createdAt', 'dueDate', 'priority']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
          page: z.coerce.number().int().positive().optional(),
          limit: z.coerce.number().int().positive().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Paginated list of tasks.',
          content: { 'application/json': { schema: paginatedOf(TaskSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
      },
    },
  },
  '/tasks/{id}': {
    get: {
      tags: ['Tasks'],
      summary: 'Get a task by id',
      description: 'MEMBER receives 404 (not 403) when the task is not assigned to them.',
      requestParams: { path: z.object({ id: z.string() }) },
      responses: {
        '200': {
          description: 'Task.',
          content: { 'application/json': { schema: successOf(TaskSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
      },
    },
    patch: {
      tags: ['Tasks'],
      summary: 'Update task detail fields (ADMIN/MANAGER only)',
      description: 'Status has its own endpoint. `null` on assigneeId or dueDate clears the field.',
      requestParams: { path: z.object({ id: z.string() }) },
      requestBody: { content: { 'application/json': { schema: updateTaskSchema } } },
      responses: {
        '200': {
          description: 'Updated task.',
          content: { 'application/json': { schema: successOf(TaskSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
        '422': Validation,
      },
    },
    delete: {
      tags: ['Tasks'],
      summary: 'Delete task (ADMIN/MANAGER only, hard delete)',
      requestParams: { path: z.object({ id: z.string() }) },
      responses: {
        '204': { description: 'Task deleted.' },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
      },
    },
  },
  '/tasks/{id}/status': {
    patch: {
      tags: ['Tasks'],
      summary: 'Transition task status (server-enforced state machine)',
      description:
        'Allowed: TODO → IN_PROGRESS|BLOCKED · IN_PROGRESS → IN_REVIEW|BLOCKED · IN_REVIEW → DONE|BLOCKED · BLOCKED → TODO|IN_PROGRESS · DONE → ∅. MEMBER may transition only their own assigned tasks. Transition into DONE stamps completedAt.',
      requestParams: { path: z.object({ id: z.string() }) },
      requestBody: { content: { 'application/json': { schema: transitionStatusSchema } } },
      responses: {
        '200': {
          description: 'Updated task.',
          content: { 'application/json': { schema: successOf(TaskSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
        '404': NotFound,
        '422': Validation,
      },
    },
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  '/analytics/tasks': {
    get: {
      tags: ['Analytics'],
      summary: 'Task analytics (overdue counts + avg completion time)',
      description:
        'ADMIN/MANAGER only. Single MongoDB aggregation pipeline ($facet for parallel metrics). `averageCompletionTimeMs` is null when the org has zero DONE tasks.',
      responses: {
        '200': {
          description: 'Analytics for the caller’s org.',
          content: { 'application/json': { schema: successOf(TaskAnalyticsSchema) } },
        },
        '401': Unauthorized,
        '403': Forbidden,
      },
    },
  },
};

const spec = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Team Task Tracker API',
    version: '0.1.0',
    description:
      'Multi-tenant backend API. Protected endpoints require a Bearer access token; most also require `x-organization-id`.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local development' }],
  tags: [
    { name: 'Auth' },
    { name: 'Organizations' },
    { name: 'Memberships' },
    { name: 'Projects' },
    { name: 'Tasks' },
    { name: 'Analytics' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      orgIdHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-organization-id',
        description: 'ObjectId of the organization context for this request.',
      },
    },
  },
  // Default applied to every operation; individual ops override (login, etc).
  security: [{ bearerAuth: [], orgIdHeader: [] }],
  paths,
});

export function mountSwagger(app: Application): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  // Raw spec endpoint for Postman/Insomnia import.
  app.get('/api/docs.json', (_req, res) => {
    res.json(spec);
  });
}
