import { type NextFunction, type Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';
import { AdditionalValidation } from '@/utils/additional-validation.util';

import {
  CreateWatchAndMemorizeSchema,
  type ICreateWatchAndMemorizeInput,
  type ISubmitResultInput,
  type IUpdateWatchAndMemorizeInput,
  LeaderboardQuerySchema,
  SubmitResultSchema,
  UpdateWatchAndMemorizeSchema,
} from './schema';
import { WatchAndMemorizeService } from './watch-and-memorize.service';

export const WatchAndMemorizeController: Router = Router()
  // POST /api/game/game-type/watch-and-memorize - Create game (need auth)
  .post(
    '/',
    validateAuth({}),
    validateBody({ schema: CreateWatchAndMemorizeSchema }),
    async (
      request: AuthedRequest<{}, {}, ICreateWatchAndMemorizeInput>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await WatchAndMemorizeService.createGame(
          request.user!.user_id,
          request.body,
        );

        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Game created successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // GET /api/game/game-type/watch-and-memorize/:gameId - Get game detail for edit (need auth)
  .get(
    '/:gameId',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await WatchAndMemorizeService.getGameDetail(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game retrieved successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // GET /api/game/game-type/watch-and-memorize/:gameId/play - Get game for play (public)
  .get(
    '/:gameId/play',
    async (request, response: Response, next: NextFunction) => {
      try {
        const { gameId } = request.params;
        const game = await WatchAndMemorizeService.getGameForPlay(gameId);

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game loaded successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // Patch /api/game/game-type/watch-and-memorize/:gameId - Update game (need auth)
  .patch(
    '/:gameId',
    validateAuth({}),
    validateBody({
      schema: UpdateWatchAndMemorizeSchema,
      file_fields: [{ name: 'thumbnail_image', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<
        { gameId: string },
        {},
        IUpdateWatchAndMemorizeInput
      >,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await WatchAndMemorizeService.updateGame(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
          request.body,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game updated successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // DELETE /api/game/game-type/watch-and-memorize/:gameId - Delete game (need auth)
  .delete(
    '/:gameId',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await WatchAndMemorizeService.deleteGame(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Game deleted successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // POST /api/game/game-type/watch-and-memorize/:gameId/submit - Submit result (optional auth)
  .post(
    '/:gameId/submit',
    validateBody({ schema: SubmitResultSchema }),
    async (
      request: AuthedRequest<{ gameId: string }, {}, ISubmitResultInput>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const userId = request.user?.user_id;
        const result = await WatchAndMemorizeService.submitResult(
          request.params.gameId,
          userId,
          request.body,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Result submitted successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // GET /api/game/game-type/watch-and-memorize/:gameId/leaderboard - Get leaderboard (public)
  .get(
    '/:gameId/leaderboard',
    async (request, response: Response, next: NextFunction) => {
      try {
        const { gameId } = request.params;

        // ✅ Validate query with default value using AdditionalValidation
        const query = AdditionalValidation.validate(
          LeaderboardQuerySchema,
          request.query,
        );

        const leaderboard = await WatchAndMemorizeService.getLeaderboard(
          gameId,
          query.limit,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Leaderboard retrieved successfully',
          leaderboard,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
