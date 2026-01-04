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

import { GroupSortService } from './group-sort.service';
import {
  CheckAnswerSchema,
  CreateGroupSortSchema,
  type ICheckAnswer,
  type ICreateGroupSort,
  type IUpdateGroupSort,
  UpdateGroupSortSchema,
} from './schema';
import { ScoreController } from './score.controller';

export const GroupSortController = Router()
  .use('/score', ScoreController)
  .post(
    '/',
    validateAuth({}),
    validateBody({
      schema: CreateGroupSortSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'files_to_upload', maxCount: 50 },
      ],
    }),
    async (
      request: AuthedRequest<{}, {}, ICreateGroupSort>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const newGame = await GroupSortService.createGroupSort(
          request.body,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Group Sort game created successfully',
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
        const game = await GroupSortService.getGroupSortGameDetail(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get Group Sort game detail successfully',
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
      schema: UpdateGroupSortSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'files_to_upload', maxCount: 50 },
      ],
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, IUpdateGroupSort>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await GroupSortService.updateGroupSort(
          request.params.game_id,
          request.body,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
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
        await GroupSortService.deleteGroupSort(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game deleted successfully',
          { success: true },
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
        const game = await GroupSortService.getGroupSortPlay(
          request.params.game_id,
          true,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get Group Sort game successfully',
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
        const game = await GroupSortService.getGroupSortPlay(
          request.params.game_id,
          false,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get Group Sort game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/:game_id/check-answer',
    validateAuth({ optional: true }),
    validateBody({
      schema: CheckAnswerSchema,
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, ICheckAnswer>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result_data = await GroupSortService.checkAnswer(
          request.params.game_id,
          request.body,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Answer checked successfully',
          result_data,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/:game_id/publish',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const publishedGame = await GroupSortService.publishGame(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game published',
          publishedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/:game_id/unpublish',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const unpublishedGame = await GroupSortService.unpublishGame(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Group Sort game unpublished',
          unpublishedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
