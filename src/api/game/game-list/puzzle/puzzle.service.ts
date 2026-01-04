import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ErrorResponse, type IPuzzleJson, prisma } from '@/common';
import { FileManager } from '@/utils';

import {
  type ICheckPuzzle,
  type ICreatePuzzle,
  type IUpdatePuzzle,
} from './schema';

export abstract class PuzzleService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static PUZZLE_SLUG = 'puzzle';

  static async createPuzzle(data: ICreatePuzzle, user_id: string) {
    await this.existGameCheck(data.name);

    const newPuzzleId = v4();
    const puzzleTemplateId = await this.getGameTemplateId();

    const thumbnailImagePath = await FileManager.upload(
      `game/puzzle/${newPuzzleId}`,
      data.thumbnail_image,
    );

    const puzzleImagePath = await FileManager.upload(
      `game/puzzle/${newPuzzleId}`,
      data.puzzle_image,
    );

    const puzzleJson: IPuzzleJson = {
      puzzle_image: puzzleImagePath,
      difficulty: data.difficulty,
      grid_size: data.grid_size,
      time_limit: data.time_limit,
      max_moves: data.max_moves,
    };

    const newGame = await prisma.games.create({
      data: {
        id: newPuzzleId,
        game_template_id: puzzleTemplateId,
        creator_id: user_id,
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_publish_immediately,
        game_json: puzzleJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return newGame;
  }

  static async getPuzzleGameDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        created_at: true,
        game_json: true,
        creator_id: true,
        total_played: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.PUZZLE_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot access this game',
      );

    return {
      ...game,
      creator_id: undefined,
      game_template: undefined,
    };
  }

  static async updatePuzzle(
    data: IUpdatePuzzle,
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.PUZZLE_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot access this game',
      );

    if (data.name) {
      const isNameExist = await prisma.games.findUnique({
        where: { name: data.name },
        select: { id: true },
      });

      if (isNameExist && isNameExist.id !== game_id)
        throw new ErrorResponse(
          StatusCodes.BAD_REQUEST,
          'Game name is already used',
        );
    }

    const oldPuzzleJson = game.game_json as IPuzzleJson | null;
    const oldImagePaths: string[] = [];

    if (oldPuzzleJson?.puzzle_image) {
      oldImagePaths.push(oldPuzzleJson.puzzle_image);
    }

    if (game.thumbnail_image) {
      oldImagePaths.push(game.thumbnail_image);
    }

    let thumbnailImagePath = game.thumbnail_image;

    if (data.thumbnail_image) {
      thumbnailImagePath = await FileManager.upload(
        `game/puzzle/${game_id}`,
        data.thumbnail_image,
      );
    }

    let puzzleImagePath = oldPuzzleJson?.puzzle_image ?? '';

    if (data.puzzle_image) {
      puzzleImagePath = await FileManager.upload(
        `game/puzzle/${game_id}`,
        data.puzzle_image,
      );
    }

    const puzzleJson: IPuzzleJson = {
      puzzle_image: puzzleImagePath,
      difficulty: data.difficulty ?? oldPuzzleJson?.difficulty ?? 'medium',
      grid_size: data.grid_size ?? oldPuzzleJson?.grid_size ?? 3,
      time_limit: data.time_limit ?? oldPuzzleJson?.time_limit,
      max_moves: data.max_moves ?? oldPuzzleJson?.max_moves,
    };

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: {
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_publish,
        game_json: puzzleJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    const newImagePaths = new Set([thumbnailImagePath, puzzleImagePath]);

    for (const oldPath of oldImagePaths) {
      if (!newImagePaths.has(oldPath)) {
        await FileManager.remove(oldPath);
      }
    }

    return updatedGame;
  }

  static async checkPuzzle(data: ICheckPuzzle, game_id: string) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        game_json: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.PUZZLE_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    const puzzleJson = game.game_json as unknown as IPuzzleJson;
    const totalPieces = puzzleJson.grid_size * puzzleJson.grid_size;

    let isComplete = true;

    for (const piece of data.pieces) {
      if (piece.id !== piece.current_position) {
        isComplete = false;
        break;
      }
    }

    let score = 0;

    if (isComplete) {
      const baseScore = 1000;
      const movesPenalty = data.moves_count * 5;
      const timePenalty = data.time_taken ? data.time_taken * 2 : 0;

      const difficultyMultiplier = this.getDifficultyMultiplier(
        puzzleJson.difficulty,
      );

      score = Math.max(
        0,
        Math.floor(
          (baseScore - movesPenalty - timePenalty) * difficultyMultiplier,
        ),
      );
    }

    return {
      game_id,
      is_complete: isComplete,
      moves_count: data.moves_count,
      time_taken: data.time_taken,
      total_pieces: totalPieces,
      score,
    };
  }

  static async getPuzzlePlay(
    game_id: string,
    is_public: boolean,
    user_id?: string,
    user_role?: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (
      !game ||
      (is_public && !game.is_published) ||
      game.game_template.slug !== this.PUZZLE_SLUG
    )
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (
      !is_public &&
      user_role !== 'SUPER_ADMIN' &&
      game.creator_id !== user_id
    )
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot get this game data',
      );

    const puzzleJson = game.game_json as unknown as IPuzzleJson | null;

    if (!puzzleJson)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Puzzle data not found');

    const totalPieces = puzzleJson.grid_size * puzzleJson.grid_size;
    const pieces = this.generateShuffledPieces(totalPieces);

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      puzzle_image: puzzleJson.puzzle_image,
      difficulty: puzzleJson.difficulty,
      grid_size: puzzleJson.grid_size,
      time_limit: puzzleJson.time_limit,
      max_moves: puzzleJson.max_moves,
      pieces,
      is_published: game.is_published,
    };
  }

  static async deletePuzzle(game_id: string, user_id: string, user_role: ROLE) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        thumbnail_image: true,
        game_json: true,
        creator_id: true,
      },
    });

    if (!game) throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot delete this game',
      );

    const oldPuzzleJson = game.game_json as IPuzzleJson | null;
    const oldImagePaths: string[] = [];

    if (oldPuzzleJson?.puzzle_image)
      oldImagePaths.push(oldPuzzleJson.puzzle_image);

    if (game.thumbnail_image) oldImagePaths.push(game.thumbnail_image);

    for (const path of oldImagePaths) {
      await FileManager.remove(path);
    }

    await prisma.games.delete({ where: { id: game_id } });

    return { id: game_id };
  }

  private static async existGameCheck(game_name?: string, game_id?: string) {
    const where: Record<string, unknown> = {};
    if (game_name) where.name = game_name;
    if (game_id) where.id = game_id;

    if (Object.keys(where).length === 0) return null;

    const game = await prisma.games.findFirst({
      where,
      select: { id: true, creator_id: true },
    });

    if (game)
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Game name is already exist',
      );

    return game;
  }

  private static async getGameTemplateId() {
    const result = await prisma.gameTemplates.findUnique({
      where: { slug: this.PUZZLE_SLUG },
      select: { id: true },
    });

    if (!result)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game template not found');

    return result.id;
  }

  private static generateShuffledPieces(totalPieces: number) {
    const pieces = [];

    for (let index = 0; index < totalPieces; index++) {
      pieces.push({
        id: index,
        correct_position: index,
        current_position: index,
      });
    }

    for (let index = pieces.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temporary = pieces[index].current_position;
      pieces[index].current_position = pieces[randomIndex].current_position;
      pieces[randomIndex].current_position = temporary;
    }

    return pieces;
  }

  private static getDifficultyMultiplier(
    difficulty: 'easy' | 'medium' | 'hard',
  ): number {
    const multipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    };

    return multipliers[difficulty];
  }
}
