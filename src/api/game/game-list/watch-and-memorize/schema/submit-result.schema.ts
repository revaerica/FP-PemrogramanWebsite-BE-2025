import { z } from 'zod';

export const SubmitResultSchema = z.object({
  score: z.number().int().min(0),
  correctAnswers: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  timeSpent: z.number().int().min(0),
  coinsEarned: z.number().int().min(0),
});

export type ISubmitResultInput = z.infer<typeof SubmitResultSchema>;
