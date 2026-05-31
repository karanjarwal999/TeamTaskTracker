export interface OverdueByAssigneeEntry {
  userId: string;
  count: number;
}

export interface TaskAnalyticsDto {
  overdueByAssignee: OverdueByAssigneeEntry[];
  averageCompletionTimeMs: number | null;
}

export interface TaskAnalyticsRow {
  overdueByAssignee: OverdueByAssigneeEntry[];
  completionTime: Array<{ averageMs: number | null }>;
}
