import { Task } from '@/db/models/task.model';
import type { CreateTaskInput } from './task.types';

export const taskRepository = {
  async create(input: CreateTaskInput) {
    return Task.create(input);
  },
};
