import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { PuzzleService } from './puzzle.service';
import {
  CheckPuzzleSchema,
  CreatePuzzleSchema,
  type ICheckPuzzle,
  type ICreatePuzzle,
  type IUpdatePuzzle,
  UpdatePuzzleSchema,
} from './schema';

export const PuzzleController = Router()
  .post(
    '/',
    validateAuth({}),
    validateBody({
      schema: CreatePuzzleSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'puzzle_image', maxCount: 1 },
      ],
    }),
    async (
      request: AuthedRequest<{}, {}, ICreatePuzzle>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const newGame = await PuzzleService.createPuzzle(
          request.body,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Puzzle created',
          newGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await PuzzleService.getPuzzleGameDetail(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id/play/public',
    async (
      request: Request<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await PuzzleService.getPuzzlePlay(
          request.params.game_id,
          true,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get public game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id/play/private',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await PuzzleService.getPuzzlePlay(
          request.params.game_id,
          true,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get private game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .patch(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdatePuzzleSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'puzzle_image', maxCount: 1 },
      ],
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, IUpdatePuzzle>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await PuzzleService.updatePuzzle(
          request.body,
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Puzzle updated',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/:game_id/check',
    validateBody({ schema: CheckPuzzleSchema }),
    async (
      request: Request<{ game_id: string }, {}, ICheckPuzzle>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await PuzzleService.checkPuzzle(
          request.body,
          request.params.game_id,
        );
        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Puzzle checked successfully',
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
  .delete(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await PuzzleService.deletePuzzle(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Puzzle deleted successfully',
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
