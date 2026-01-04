import z from 'zod';

import { fileSchema, StringToBooleanSchema } from '@/common';

export const CreatePuzzleSchema = z.object({
  name: z.string().max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}),
  puzzle_image: fileSchema({}),
  is_publish_immediately: StringToBooleanSchema.default(false),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  grid_size: z.coerce.number().min(2).max(6).default(3),
  time_limit: z.coerce.number().min(30).max(3600).optional(),
  max_moves: z.coerce.number().min(10).max(1000).optional(),
});

export type ICreatePuzzle = z.infer<typeof CreatePuzzleSchema>;
