import { z } from 'zod';

export const LeaderboardQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(value => Number.parseInt(value, 10))
    .pipe(z.number().int().min(1).max(100)),
});

export type ILeaderboardQueryInput = z.infer<typeof LeaderboardQuerySchema>;
