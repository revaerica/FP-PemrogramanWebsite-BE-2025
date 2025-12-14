import { z } from "zod";

export const DifficultyConfigSchema = z.object({
  animalsToWatch: z.number().int().min(1),
  memorizationTime: z.number().int().min(1),
  totalRounds: z.number().int().min(1),
  shuffleSpeed: z.number().int().min(100),
  guessTimeLimit: z.number().int().min(1),
});

export const CreateWatchAndMemorizeSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),

  thumbnail_image: z.any(),
  background_music: z.any().optional(),

  is_publish_immediately: z
    .union([z.string(), z.boolean()])
    .transform(val => val === "true" || val === true),

  difficulty_configs: z.string().transform(val => JSON.parse(val)),
  available_animals: z.string().transform(val => JSON.parse(val)),
  shop_config: z.string().transform(val => JSON.parse(val)),
});

export type CreateWatchAndMemorizeInput =
  z.infer<typeof CreateWatchAndMemorizeSchema>;
