/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-default-export */
import { Router } from 'express';

import { AnagramController } from './anagram/anagram.controller';
import { PairOrNoPairController } from './pair-or-no-pair/pair-or-no-pair.controller';
import { QuizController } from './quiz/quiz.controller';
import { SpeedSortingController } from './speed-sorting/speed-sorting.controller';
import { CoinsController } from './watch-and-memorize/coins.controller';
import { PendantController } from './watch-and-memorize/pendant.controller';
import { WatchAndMemorizeController } from './watch-and-memorize/watch-and-memorize.controller';

const GameListRouter = Router();

GameListRouter.use('/quiz', QuizController);
GameListRouter.use('/speed-sorting', SpeedSortingController);
GameListRouter.use('/anagram', AnagramController);
GameListRouter.use('/pair-or-no-pair', PairOrNoPairController);
GameListRouter.use('/watch-and-memorize', WatchAndMemorizeController);
GameListRouter.use('/watch-and-memorize/coins', CoinsController);
GameListRouter.use('/watch-and-memorize/pendant', PendantController);

export default GameListRouter;
