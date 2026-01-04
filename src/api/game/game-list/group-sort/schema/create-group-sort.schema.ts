import z from 'zod';

import {
  fileArraySchema,
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

export const GroupSortItemSchema = z.object({
  item_text: z.string().max(512).trim(),
  item_image_array_index: z
    .union([z.coerce.number().min(0).max(50), z.string()])
    .optional(),
  item_hint: z.string().max(512).trim().optional(),
});

export const GroupSortCategorySchema = z.object({
  category_name: z.string().max(256).trim(),
  items: z.array(GroupSortItemSchema).min(1).max(20),
});

export const CreateGroupSortSchema = z.object({
  name: z.string().max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}),
  is_publish_immediately: StringToBooleanSchema.default(false),
  is_category_randomized: StringToBooleanSchema.default(false),
  is_item_randomized: StringToBooleanSchema.default(false),
  score_per_item: z.coerce
    .number()
    .min(10, 'Poin per item minimal 10')
    .max(1000)
    .default(10),
  time_limit: z.coerce
    .number()
    .min(30, 'Waktu limit minimal 30 detik')
    .max(600)
    .default(60),
  files_to_upload: fileArraySchema({
    max_size: 5 * 1024 * 1024,
    min_amount: 0,
    max_amount: 50,
  }).optional(),
  categories: StringToObjectSchema(
    z.array(GroupSortCategorySchema).min(2).max(10),
  ),
});

export type ICreateGroupSort = z.infer<typeof CreateGroupSortSchema>;
