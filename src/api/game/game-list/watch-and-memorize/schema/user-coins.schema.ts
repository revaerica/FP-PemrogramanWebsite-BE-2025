import { z } from 'zod';

export const GetUserCoinsSchema = z.object({
  userId: z.string().uuid(),
});

export const AddCoinsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(1),
});

export const DeductCoinsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(1),
});

export type IGetUserCoinsInput = z.infer<typeof GetUserCoinsSchema>;
export type IAddCoinsInput = z.infer<typeof AddCoinsSchema>;
export type IDeductCoinsInput = z.infer<typeof DeductCoinsSchema>;
