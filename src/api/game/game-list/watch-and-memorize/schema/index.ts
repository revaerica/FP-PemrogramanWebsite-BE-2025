import { type z } from 'zod';

import { type CreateWatchAndMemorizeSchema } from './create-watch-and-memorize.schema';
import { type LeaderboardQuerySchema } from './leaderboard-query.schema';
import { type PurchasePendantSchema } from './pendant.schema';
import { type SubmitResultSchema } from './submit-result.schema';
import { type UpdateWatchAndMemorizeSchema } from './update-watch-and-memorize.schema';
import {
  type AddCoinsSchema,
  type DeductCoinsSchema,
  type GetUserCoinsSchema,
} from './user-coins.schema';

export * from './create-watch-and-memorize.schema';
export * from './leaderboard-query.schema';
export * from './pendant.schema';
export * from './submit-result.schema';
export * from './update-watch-and-memorize.schema';
export * from './user-coins.schema';

export type ICreateWatchAndMemorizeInput = z.infer<
  typeof CreateWatchAndMemorizeSchema
>;
export type IUpdateWatchAndMemorizeInput = z.infer<
  typeof UpdateWatchAndMemorizeSchema
>;

export type ISubmitResultInput = z.infer<typeof SubmitResultSchema>;
export type ILeaderboardQueryInput = z.infer<typeof LeaderboardQuerySchema>;

export type IGetUserCoinsInput = z.infer<typeof GetUserCoinsSchema>;
export type IAddCoinsInput = z.infer<typeof AddCoinsSchema>;
export type IDeductCoinsInput = z.infer<typeof DeductCoinsSchema>;
export type IPurchasePendantInput = z.infer<typeof PurchasePendantSchema>;
