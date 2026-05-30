import type { ToObjectOptions } from 'mongoose';

// Shared toJSON config: expose `id`, drop `_id` + `__v`. Keeps wire shape clean and consistent.
export const toJSONOption: ToObjectOptions = {
  virtuals: true,
  transform: (_doc, ret) => {
    const record = ret as Record<string, unknown>;
    if (record._id !== undefined) {
      record.id = String(record._id);
      delete record._id;
    }
    delete record.__v;
    return record;
  },
};
