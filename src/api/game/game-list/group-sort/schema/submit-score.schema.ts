import z from 'zod';

import { StringToObjectSchema } from '@/common';

export const SubmitScoreSchema = z.object({
  game_id: z.string().uuid(),
  score: z.number().int().min(0),
  time_spent: z.number().int().min(0).optional(),
  game_data: StringToObjectSchema(z.record(z.string(), z.any())).optional(),
});

export type ISubmitScore = z.infer<typeof SubmitScoreSchema>;
