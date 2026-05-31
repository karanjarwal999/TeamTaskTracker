import { Schema, model, type InferSchemaType } from 'mongoose';
import { toJSONOption } from '@/shared/utils/mongoose';

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true, // every project query is org-scoped
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: toJSONOption,
  },
);

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const Project = model('Project', projectSchema);
