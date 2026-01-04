import { type NextFunction, type Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { GroupSortScoreService } from './group-sort-score.service';
import { type ISubmitScore, SubmitScoreSchema } from './schema';
import { ScoreService } from './score.service';

export const ScoreController = Router()
  .post(
    '/submit',
    validateAuth({ optional: true }),
    validateBody({ schema: SubmitScoreSchema }),
    async (
      request: AuthedRequest<{}, {}, ISubmitScore>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const userId = request.user?.user_id || 'guest';

        // Use GroupSortScoreService for group-sort games
        // Use ScoreService for other games (fallback)
        let score;

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          score = await GroupSortScoreService.submitScore(userId, request.body);
        } catch {
          // Fallback to ScoreService for non-group-sort games
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          score = await ScoreService.submitScore(userId, request.body);
        }

        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Score submitted successfully',
          score,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/highest/:game_id',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const userId = request.user?.user_id || 'guest';

        // Use GroupSortScoreService for group-sort games
        let highestScore;

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          highestScore = await GroupSortScoreService.getHighestScore(
            userId,
            request.params.game_id,
          );
        } catch {
          // Fallback to ScoreService for non-group-sort games
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          highestScore = await ScoreService.getHighestScore(
            userId,
            request.params.game_id,
          );
        }

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Highest score retrieved successfully',
          highestScore || { score: 0 },
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/history/:game_id',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const limit = request.query.limit
          ? Number.parseInt(request.query.limit as string)
          : 10;

        const userId = request.user?.user_id || 'guest';

        // Use GroupSortScoreService for group-sort games
        let history;

        try {
          history = await GroupSortScoreService.getUserGameHistory(
            userId,
            request.params.game_id,
            limit,
          );
        } catch {
          // Fallback to ScoreService for non-group-sort games
          history = await ScoreService.getUserGameHistory(
            userId,
            request.params.game_id,
            limit,
          );
        }

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game history retrieved successfully',
          history,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/leaderboard/:game_id',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const limit = request.query.limit
          ? Number.parseInt(request.query.limit as string)
          : 10;

        // Use GroupSortScoreService for group-sort games
        // Use ScoreService for other games (fallback)
        let leaderboard;

        try {
          leaderboard = await GroupSortScoreService.getGameLeaderboard(
            request.params.game_id,
            limit,
          );
        } catch {
          // Fallback to ScoreService for non-group-sort games
          leaderboard = await ScoreService.getGameLeaderboard(
            request.params.game_id,
            limit,
          );
        }

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
  )
  .get(
    '/user/all-scores',
    validateAuth({}),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const allScores = await ScoreService.getUserAllScores(
          request.user!.user_id,
        );

        const result = new SuccessResponse(
          StatusCodes.OK,
          'All user scores retrieved successfully',
          allScores,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
