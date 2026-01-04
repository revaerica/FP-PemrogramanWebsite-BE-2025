import z from 'zod';

import {
  fileArraySchema,
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

// Item schema for updates (allows both number index and string path for item_image_array_index)
export const UpdateGroupSortItemSchema = z.object({
  item_text: z.string().max(512).trim(),
  item_image_array_index: z
    .union([z.coerce.number().min(0).max(50), z.string()])
    .optional(),
  item_hint: z.string().max(512).trim().optional(),
});

// Category schema for updates using the update item schema
export const UpdateGroupSortCategorySchema = z.object({
  category_name: z.string().max(256).trim(),
  items: z.array(UpdateGroupSortItemSchema).min(1).max(20),
});

export const UpdateGroupSortSchema = z.object({
  name: z.string().max(128).trim().optional(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}).optional(),
  is_publish: StringToBooleanSchema.optional(),
  is_category_randomized: StringToBooleanSchema.optional(),
  is_item_randomized: StringToBooleanSchema.optional(),
  score_per_item: z.coerce
    .number()
    .min(10, 'Poin per item minimal 10')
    .max(1000)
    .optional(),
  time_limit: z.coerce
    .number()
    .min(30, 'Waktu limit minimal 30 detik')
    .max(600)
    .optional(),
  files_to_upload: fileArraySchema({
    max_size: 5 * 1024 * 1024,
    min_amount: 0,
    max_amount: 50,
  }).optional(),
  categories: StringToObjectSchema(
    z.array(UpdateGroupSortCategorySchema).min(2).max(10),
  ).optional(),
});

export type IUpdateGroupSort = z.infer<typeof UpdateGroupSortSchema>;
