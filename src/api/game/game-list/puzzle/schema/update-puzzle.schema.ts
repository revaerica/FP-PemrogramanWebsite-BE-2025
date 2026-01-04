import z from 'zod';

import { fileSchema, StringToBooleanSchema } from '@/common';

export const UpdatePuzzleSchema = z.object({
  name: z.string().max(128).trim().optional(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}).optional(),
  puzzle_image: fileSchema({}).optional(),
  is_publish: StringToBooleanSchema.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  grid_size: z.coerce.number().min(2).max(6).optional(),
  time_limit: z.coerce.number().min(30).max(3600).optional(),
  max_moves: z.coerce.number().min(10).max(1000).optional(),
});

export type IUpdatePuzzle = z.infer<typeof UpdatePuzzleSchema>;
