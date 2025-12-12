import { type z } from 'zod';

import { type CreateWatchAndMemorizeSchema } from './create-watch-and-memorize.schema';
import { type SubmitResultSchema } from './submit-result.schema';
import { type UpdateWatchAndMemorizeSchema } from './update-watch-and-memorize.schema';

export * from './create-watch-and-memorize.schema';
export * from './submit-result.schema';
export * from './update-watch-and-memorize.schema';

export type ICreateWatchAndMemorizeInput = z.infer<
  typeof CreateWatchAndMemorizeSchema
>;
export type IUpdateWatchAndMemorizeInput = z.infer<
  typeof UpdateWatchAndMemorizeSchema
>;
export type ISubmitResultInput = z.infer<typeof SubmitResultSchema>;
