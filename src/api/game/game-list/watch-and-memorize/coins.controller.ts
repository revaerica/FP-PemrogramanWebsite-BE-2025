import { type NextFunction, type Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { type AuthedRequest, SuccessResponse, validateAuth } from '@/common';

import { CoinsService } from './coins.service';

export const CoinsController = Router()
  /**
   * GET /api/game/game-type/watch-and-memorize/coins
   * Get user's current coins balance (auth required)
   */
  .get(
    '/',
    validateAuth({}),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const coins = await CoinsService.getUserCoins(request.user!.user_id);

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Coins retrieved successfully',
          coins,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
