import { z } from 'zod';

const GameJsonSchema = z.object({
  difficulty: z.enum(['easy', 'normal', 'hard']),
  animalsToWatch: z.number().int().min(3).max(5),
  memorizationTime: z.number().int().min(5000).max(15000),
  guessTimeLimit: z.number().int().min(20).max(40),
  totalRounds: z.number().int().min(3).max(5),
  animalSequence: z.array(z.string()).min(3).max(20),
});

export const UpdateWatchAndMemorizeSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  thumbnail_image: z.string().url().optional(),
  game_json: GameJsonSchema.optional(),
  is_published: z.boolean().optional(),
});

export type UpdateWatchAndMemorizeInput = z.infer<typeof UpdateWatchAndMemorizeSchema>;