import { z } from 'zod';

import {
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

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

const DifficultyConfigSchema = z.object({
  animalsToWatch: z.number().int().min(3).max(8),
  memorizationTime: z.number().int().min(3).max(15),
  totalRounds: z.number().int().min(1).max(5),
  shuffleSpeed: z.number().int().min(100).max(2000),
  guessTimeLimit: z.number().int().min(10).max(60),
});

const ShopItemConfigSchema = z.object({
  price: z.number().int().min(0),
  available: z.boolean(),
});

const GameJsonSchema = z.object({
  difficulty_configs: z
    .object({
      easy: DifficultyConfigSchema,
      medium: DifficultyConfigSchema,
      hard: DifficultyConfigSchema,
    })
    .optional(),
  available_animals: z.array(z.enum(VALID_ANIMALS)).min(3).max(8).optional(),
  shop_config: z
    .object({
      hint: ShopItemConfigSchema,
      freeze: ShopItemConfigSchema,
      double: ShopItemConfigSchema,
      shield: ShopItemConfigSchema,
      reveal: ShopItemConfigSchema,
    })
    .optional(),
  background_music: z.string().optional(),
});

export const UpdateWatchAndMemorizeSchema = z.object({
  name: z.string().min(3).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  thumbnail_image: fileSchema({}).optional(),
  is_published: StringToBooleanSchema.optional(),
  game_json: StringToObjectSchema(GameJsonSchema).optional(),
});

export type IUpdateWatchAndMemorizeInput = z.infer<
  typeof UpdateWatchAndMemorizeSchema
>;

