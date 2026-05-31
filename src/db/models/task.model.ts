import { Schema, model, type InferSchemaType } from 'mongoose';
import { toJSONOption } from '@/shared/utils/mongoose';
import { TaskStatus, TASK_STATUS_VALUES } from '@/shared/enums/task-status.enum';
import { TaskPriority, TASK_PRIORITY_VALUES } from '@/shared/enums/task-priority.enum';

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
    priority: {
      type: String,
      enum: TASK_PRIORITY_VALUES,
      required: true,
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: TASK_STATUS_VALUES,
      required: true,
      default: TaskStatus.TODO,
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    dueDate: { type: Date, required: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    completedAt: { type: Date, required: false },
  },
  {
    timestamps: true,
    toJSON: toJSONOption,
  },
);

taskSchema.index({ status: 1 });
taskSchema.index({ assigneeId: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ organizationId: 1, assigneeId: 1, status: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema>;
export const Task = model('Task', taskSchema);
