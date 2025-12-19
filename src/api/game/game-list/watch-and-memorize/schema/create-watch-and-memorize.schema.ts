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

// Difficulty Config Schema
const DifficultyConfigSchema = z.object({
  animalsToWatch: z.number().int().min(3).max(5),
  memorizationTime: z.number().int().min(3).max(10),
  totalRounds: z.number().int().min(1).max(5),
  shuffleSpeed: z.number().int().min(500).max(2000),
  guessTimeLimit: z.number().int().min(10).max(60),
});

// Shop Item Schema
const ShopItemSchema = z.object({
  price: z.number().int().min(0),
  available: z.boolean(),
});

// Game JSON Schema (yang disimpan di field game_json)
const GameJsonSchema = z.object({
  difficulty_configs: z.object({
    easy: DifficultyConfigSchema,
    medium: DifficultyConfigSchema,
    hard: DifficultyConfigSchema,
  }),
  available_animals: z.array(z.enum(VALID_ANIMALS)).min(3).max(8),
  shop_config: z.object({
    hint: ShopItemSchema,
    freeze: ShopItemSchema,
    double: ShopItemSchema,
    shield: ShopItemSchema,
    reveal: ShopItemSchema,
  }),
  background_music: z.string().optional(), // base64 audio
});

// Main Create Schema
export const CreateWatchAndMemorizeSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  thumbnail_image: z.string(), // base64 image
  is_publish_immediately: z.boolean().default(false),
  game_json: GameJsonSchema,
});

export type ICreateWatchAndMemorizeInput = z.infer<
  typeof CreateWatchAndMemorizeSchema
>;
