import { z } from "zod";

import { CreateWatchAndMemorizeSchema } from "./create-watch-and-memorize.schema";
import { UpdateWatchAndMemorizeSchema } from "./update-watch-and-memorize.schema";
import { SubmitResultSchema } from "./submit-result.schema";

export * from "./create-watch-and-memorize.schema";
export * from "./update-watch-and-memorize.schema";
export * from "./submit-result.schema";

export type CreateWatchAndMemorizeInput = z.infer<typeof CreateWatchAndMemorizeSchema>;
export type UpdateWatchAndMemorizeInput = z.infer<typeof UpdateWatchAndMemorizeSchema>;
export type SubmitResultInput = z.infer<typeof SubmitResultSchema>;