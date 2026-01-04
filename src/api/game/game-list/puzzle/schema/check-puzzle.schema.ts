import z from 'zod';

export const CheckPuzzleSchema = z.object({
  pieces: z
    .array(
      z.object({
        id: z.number().min(0),
        current_position: z.number().min(0),
      }),
    )
    .min(1),
  moves_count: z.number().min(0),
  time_taken: z.number().min(0).optional(),
});

export type ICheckPuzzle = z.infer<typeof CheckPuzzleSchema>;
