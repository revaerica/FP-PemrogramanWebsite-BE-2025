import { z } from 'zod';

export const PurchasePendantSchema = z.object({
  pendantId: z.enum(['hint', 'freeze', 'double', 'shield', 'reveal']),
});

export type IPurchasePendantInput = z.infer<typeof PurchasePendantSchema>;
