import { Schema, model, type InferSchemaType } from 'mongoose';
import { toJSONOption } from '@/shared/utils/mongoose';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: toJSONOption,
  },
);

export type OrganizationDocument = InferSchemaType<typeof organizationSchema>;
export const Organization = model('Organization', organizationSchema);
