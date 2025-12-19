import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';
import {
  type IWatchAndMemorizeGameJson,
  type IWatchAndMemorizePlayResponse,
} from '@/common/interface/games';
import { FileManager } from '@/utils';

import { CoinsService } from './coins.service';
import {
  type ICreateWatchAndMemorizeInput,
  type ISubmitResultInput,
  type IUpdateWatchAndMemorizeInput,
} from './schema';

export abstract class WatchAndMemorizeService {
  private static templateSlug = 'watch-and-memorize';

  // CREATE: Buat game baru
  static async createGame(userId: string, data: ICreateWatchAndMemorizeInput) {
    const template = await prisma.gameTemplates.findUnique({
      where: { slug: this.templateSlug },
      select: { id: true },
    });

    if (!template) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game template not found');
    }

    const existingGame = await prisma.games.findUnique({
      where: { name: data.name },
      select: { id: true },
    });

    if (existingGame) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Game name already exists',
      );
    }

    // ✅ FIXED - Semua data masuk ke game_json
    const game = await prisma.games.create({
      data: {
        name: data.name,
        description: data.description,
        thumbnail_image: data.thumbnail_image,
        game_template_id: template.id,
        creator_id: userId,
        game_json: data.game_json as unknown as Prisma.InputJsonValue,
        is_published: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        created_at: true,
      },
    });

    return game;
  }

  // GET: Detail game untuk edit (owner only)
  static async getGameDetail(gameId: string, userId: string, userRole: ROLE) {
    const game = await prisma.games.findUnique({
      where: { id: gameId },
      include: {
        creator: {
          select: { id: true, username: true },
        },
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.templateSlug) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    if (userRole !== 'SUPER_ADMIN' && game.creator_id !== userId) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'Unauthorized to access this game',
      );
    }

    return {
      ...game,
      game_template: undefined,
    };
  }

  // GET: Data game untuk play (public, published only)
  static async getGameForPlay(
    gameId: string,
  ): Promise<IWatchAndMemorizePlayResponse> {
    const game = await prisma.games.findUnique({
      where: {
        id: gameId,
        is_published: true,
      },
      include: {
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.templateSlug) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Game not found or not published',
      );
    }

    await prisma.games.update({
      where: { id: gameId },
      data: { total_played: { increment: 1 } },
    });

    // ✅ FIXED - Parse game_json dengan benar
    const gameJson = game.game_json as unknown as IWatchAndMemorizeGameJson;

    return {
      id: game.id,
      name: game.name,
      thumbnail_image: game.thumbnail_image,
      difficulty: gameJson.difficulty,
      animalsToWatch: gameJson.animalsToWatch,
      memorizationTime: gameJson.memorizationTime,
      guessTimeLimit: gameJson.guessTimeLimit,
      totalRounds: gameJson.totalRounds,
      animalSequence: gameJson.animalSequence,
      coinsReward: gameJson.coinsReward?.[gameJson.difficulty],
      pendantsEnabled: gameJson.pendantsAvailable ?? false,
    };
  }

  // UPDATE: Edit game

  // UPDATE: Edit game
  static async updateGame(
    gameId: string,
    userId: string,
    userRole: ROLE,
    data: IUpdateWatchAndMemorizeInput,
  ) {
    // ✅ Get existing game data
    const existing = await prisma.games.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        creator_id: true,
        game_json: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!existing) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    if (existing.game_template.slug !== this.templateSlug) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Game is not a Watch and Memorize template',
      );
    }

    // ✅ Check authorization
    if (existing.creator_id !== userId && userRole !== 'SUPER_ADMIN') {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not allowed to update this game',
      );
    }

    // ✅ Check duplicate name (if name is being changed)
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.games.findFirst({
        where: {
          name: data.name,
          id: { not: gameId },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ErrorResponse(
          StatusCodes.BAD_REQUEST,
          'Game name already exists',
        );
      }
    }

    // ✅ Handle thumbnail image update
    let thumbnailImagePath = existing.thumbnail_image;

    if (data.thumbnail_image) {
      thumbnailImagePath = await FileManager.upload(
        `game/watch-and-memorize/${gameId}`,
        data.thumbnail_image,
      );

      // Remove old thumbnail if it exists
      if (existing.thumbnail_image) {
        await FileManager.remove(existing.thumbnail_image);
      }
    }

    // ✅ Prepare update data
    const updateData: Prisma.GamesUpdateInput = {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      thumbnail_image: thumbnailImagePath,
      is_published:
        data.is_publish == null ? existing.is_published : data.is_publish,
    };

    // ✅ Only update game_json if provided
    if (data.game_json !== undefined) {
      updateData.game_json = data.game_json as unknown as Prisma.InputJsonValue;
    }

    // ✅ Update game
    const updated = await prisma.games.update({
      where: { id: gameId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
      },
    });

    return updated;
  }

  // DELETE: Hapus game
  static async deleteGame(gameId: string, userId: string, userRole: ROLE) {
    await this.getGameDetail(gameId, userId, userRole);

    await prisma.games.delete({
      where: { id: gameId },
    });

    return { id: gameId };
  }

  // SUBMIT: Submit hasil gameplay & save to leaderboard
  static async submitResult(
    gameId: string,
    userId: string | undefined,
    data: ISubmitResultInput,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: gameId },
      include: {
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.templateSlug) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    const gameJson = game.game_json as unknown as IWatchAndMemorizeGameJson;

    if (userId) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new ErrorResponse(StatusCodes.NOT_FOUND, 'User not found');
      }

      // Save to leaderboard
      await prisma.leaderboard.create({
        data: {
          user_id: userId,
          game_id: gameId,
          score: data.score,
          difficulty: gameJson.difficulty,
          time_taken: data.timeSpent,
        },
      });

      // Update game played count
      await prisma.users.update({
        where: { id: userId },
        data: { total_game_played: { increment: 1 } },
      });

      // ⭐ ADD COINS TO USER
      if (data.coinsEarned > 0) {
        await CoinsService.addCoins(userId, data.coinsEarned);
      }
    }

    const rank = await this.getPlayerRank(gameId, data.score);

    return {
      success: true,
      score: data.score,
      correctAnswers: data.correctAnswers,
      totalQuestions: data.totalQuestions,
      timeSpent: data.timeSpent,
      coinsEarned: data.coinsEarned,
      rank,
      message:
        data.correctAnswers === data.totalQuestions
          ? 'Perfect score!'
          : 'Great effort!',
    };
  }

  // GET: Leaderboard
  static async getLeaderboard(gameId: string, limit: number = 10) {
    const game = await prisma.games.findUnique({
      where: { id: gameId },
      include: {
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.templateSlug) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    const leaderboard = await prisma.leaderboard.findMany({
      where: { game_id: gameId },
      include: {
        user: {
          select: {
            username: true,
            profile_picture: true,
          },
        },
      },
      orderBy: [{ score: 'desc' }, { time_taken: 'asc' }],
      take: limit,
    });

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.user?.username || 'Guest',
      profile_picture: entry.user?.profile_picture,
      score: entry.score,
      time_taken: entry.time_taken,
      difficulty: entry.difficulty,
      created_at: entry.created_at,
    }));
  }

  // Helper: Get player rank
  private static async getPlayerRank(
    gameId: string,
    score: number,
  ): Promise<number> {
    const count = await prisma.leaderboard.count({
      where: {
        game_id: gameId,
        score: { gt: score },
      },
    });

    return count + 1;
  }
}
