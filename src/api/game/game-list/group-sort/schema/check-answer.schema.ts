import z from 'zod';

export const CheckAnswerItemSchema = z.object({
  item_id: z.string(),
  category_id: z.string(),
});

export const CheckAnswerSchema = z.object({
  answers: z.array(CheckAnswerItemSchema),
});

export type ICheckAnswer = z.infer<typeof CheckAnswerSchema>;
