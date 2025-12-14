import { z } from 'zod';

const VALID_ANIMALS = [
  'penguin',
  'cow',
  'fox',
  'bear',
  'dog',
  'duck',
  'lamb',
  'hedgehog',
] as const;

const GameJsonSchema = z.object({
  difficulty: z.enum(['easy', 'normal', 'hard']),
  animalsToWatch: z.number().int().min(3).max(5),
  memorizationTime: z.number().int().min(5000).max(15_000),
  guessTimeLimit: z.number().int().min(20).max(40),
  totalRounds: z.number().int().min(3).max(5),
  animalSequence: z
    .array(z.enum(VALID_ANIMALS))
    .min(3)
    .max(20)
    .refine(
      animals => animals.every(animal => VALID_ANIMALS.includes(animal)),
      {
        message: `Animals must be one of: ${VALID_ANIMALS.join(', ')}`,
      },
    ),
});

export const UpdateWatchAndMemorizeSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  thumbnail_image: z.string().url().optional(),
  game_json: GameJsonSchema.optional(),
  is_published: z.boolean().optional(),
});

export type IUpdateWatchAndMemorizeInput = z.infer<
  typeof UpdateWatchAndMemorizeSchema
>;
