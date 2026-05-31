import { Types } from 'mongoose';
import { Task } from '@/db/models/task.model';
import { TaskStatus } from '@/shared/enums/task-status.enum';
import type { TaskAnalyticsRow } from './analytics.types';

export const analyticsRepository = {
  async getTaskAnalytics(organizationId: string, now: Date): Promise<TaskAnalyticsRow> {
    const orgId = new Types.ObjectId(organizationId);

    const result = await Task.aggregate<TaskAnalyticsRow>([
      { $match: { organizationId: orgId } },
      {
        $facet: {
          // Overdue = status ≠ DONE AND dueDate < now AND assignee is set.
          // A task with no assignee can't be "overdue for someone" — skip it.
          overdueByAssignee: [
            {
              $match: {
                assigneeId: { $ne: null, $exists: true },
                dueDate: { $lt: now },
                status: { $ne: TaskStatus.DONE },
              },
            },
            { $group: { _id: '$assigneeId', count: { $sum: 1 } } },
            { $project: { _id: 0, userId: { $toString: '$_id' }, count: 1 } },
          ],
          completionTime: [
            {
              $match: {
                status: TaskStatus.DONE,
                completedAt: { $ne: null, $exists: true },
              },
            },
            { $project: { durationMs: { $subtract: ['$completedAt', '$createdAt'] } } },
            { $group: { _id: null, averageMs: { $avg: '$durationMs' } } },
            { $project: { _id: 0, averageMs: 1 } },
          ],
        },
      },
    ]);

    return result[0]!;
  },
};
