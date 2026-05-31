import { analyticsRepository } from './analytics.repository';
import type { TaskAnalyticsDto } from './analytics.types';

export const analyticsService = {
  async getTaskAnalytics(organizationId: string): Promise<TaskAnalyticsDto> {
    const raw = await analyticsRepository.getTaskAnalytics(organizationId, new Date());
    return {
      overdueByAssignee: raw.overdueByAssignee,
      averageCompletionTimeMs: raw.completionTime[0]?.averageMs ?? null,
    };
  },
};
