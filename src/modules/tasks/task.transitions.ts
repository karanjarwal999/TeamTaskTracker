import { TaskStatus } from '@/shared/enums/task-status.enum';

export const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED],
  [TaskStatus.IN_REVIEW]: [TaskStatus.DONE, TaskStatus.BLOCKED],
  [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
  [TaskStatus.DONE]: [],
};

export function isAllowedTransition(from: TaskStatus, to: TaskStatus): boolean {
  return transitions[from].includes(to);
}
