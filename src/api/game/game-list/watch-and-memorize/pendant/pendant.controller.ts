import { type NextFunction, type Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { PurchasePendantSchema } from '../schema';
import { PendantService } from './pendant.service';

export const PendantController = Router()
  // GET /api/game/game-type/watch-and-memorize/pendant/shop - Get available pendants
  .get('/shop', async (request, response: Response, next: NextFunction) => {
    try {
      const pendants = await PendantService.getAvailablePendants();

      const result = new SuccessResponse(
        StatusCodes.OK,
        'Pendants retrieved successfully',
        pendants,
      );

      return response.status(result.statusCode).json(result.json());
    } catch (error) {
      return next(error);
    }
  })

  // GET /api/game/game-type/watch-and-memorize/pendant/owned - Get user's owned pendants
  .get(
    '/owned',
    validateAuth({}),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const pendants = await PendantService.getUserPendants(
          request.user!.user_id,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Owned pendants retrieved successfully',
          pendants,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // POST /api/game/game-type/watch-and-memorize/pendant/purchase - Purchase pendant
  .post(
    '/purchase',
    validateAuth({}),
    validateBody({ schema: PurchasePendantSchema }), // ⭐ TAMBAHAN VALIDATION
    async (
      request: AuthedRequest<{}, {}, { pendantId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await PendantService.purchasePendant(
          request.user!.user_id,
          request.body.pendantId,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Pendant purchased successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  );
