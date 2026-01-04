import { type Leaderboard } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';

import { type ISubmitScore } from './schema';

// Type alias untuk kompatibilitas
type GameScoresProps = Leaderboard;

export abstract class ScoreService {
  static async submitScore(
    userId: string,
    scoreData: ISubmitScore,
  ): Promise<GameScoresProps> {
    // Check if game exists and is published
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const game = await prisma.games.findUnique({
      where: { id: scoreData.game_id },
      select: { id: true, is_published: true },
    });

    if (!game) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    if (!game.is_published) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'Cannot submit score for unpublished game',
      );
    }

    // Create score record
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const score = await prisma.leaderboard.create({
      data: {
        user_id: userId,
        game_id: scoreData.game_id,
        score: scoreData.score,
        time_taken: scoreData.time_spent,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return score;
  }

  static async getHighestScore(
    userId: string,
    gameId: string,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  ): Promise<GameScoresProps | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const highestScore = await prisma.leaderboard.findFirst({
      where: {
        user_id: userId,
        game_id: gameId,
      },
      orderBy: {
        score: 'desc',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return highestScore;
  }

  static async getUserGameHistory(
    userId: string,
    gameId: string,
    limit: number = 10,
  ): Promise<GameScoresProps[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const history = await prisma.leaderboard.findMany({
      where: {
        user_id: userId,
        game_id: gameId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return history;
  }

  static async getGameLeaderboard(
    gameId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      user_id: string;
      username: string;
      highest_score: number;
      total_plays: number;
    }>
  > {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const leaderboard = await prisma.leaderboard.groupBy({
      by: ['user_id'],
      where: {
        game_id: gameId,
      },
      _max: {
        score: true,
      },
      _count: true,
      orderBy: {
        _max: {
          score: 'desc',
        },
      },
      take: limit,
    });

    // Get user details
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      leaderboard.map(
        async (entry: {
          user_id: string | null;
          _max: { score: number | null };
          _count: number;
        }) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const user = await prisma.users.findUnique({
            where: { id: entry.user_id || '' },
            select: { username: true },
          });

          return {
            user_id: entry.user_id || '',
            username: user?.username || 'Unknown',
            highest_score: entry._max.score || 0,
            total_plays: entry._count,
          };
        },
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }

  static async getUserAllScores(userId: string): Promise<
    Array<{
      game_id: string;
      game_name: string;
      highest_score: number;
      total_plays: number;
      last_played: Date;
    }>
  > {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const scores = await prisma.leaderboard.groupBy({
      by: ['game_id'],
      where: {
        user_id: userId,
      },
      _max: {
        score: true,
        created_at: true,
      },
      _count: true,
      orderBy: {
        _max: {
          created_at: 'desc',
        },
      },
    });

    // Get game details
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      scores.map(
        async (entry: {
          game_id: string | null;
          _max: { score: number | null; created_at: Date | null };
          _count: number;
        }) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const game = await prisma.games.findUnique({
            where: { id: entry.game_id || '' },
            select: { name: true },
          });

          return {
            game_id: entry.game_id || '',
            game_name: game?.name || 'Unknown',
            highest_score: entry._max.score || 0,
            total_plays: entry._count,
            last_played: entry._max.created_at || new Date(),
          };
        },
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }

  // TAMBAHAN: Global Leaderboard untuk semua Group Sort games
  static async getGlobalGroupSortLeaderboard(limit: number = 10): Promise<
    Array<{
      user_id: string;
      username: string;
      total_score: number;
      total_plays: number;
    }>
  > {
    // Get game template ID for Group Sort
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const groupSortTemplate = await prisma.gameTemplates.findUnique({
      where: { slug: 'group-sort' },
      select: { id: true },
    });

    if (!groupSortTemplate) {
      return [];
    }

    // Get all Group Sort games
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const groupSortGames = await prisma.games.findMany({
      where: {
        game_template_id: groupSortTemplate.id,
      },
      select: { id: true },
    });

    const gameIds = groupSortGames.map(g => g.id);

    if (gameIds.length === 0) {
      return [];
    }

    // Group by user and sum all scores across all Group Sort games
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const leaderboard = await prisma.leaderboard.groupBy({
      by: ['user_id'],
      where: {
        game_id: {
          in: gameIds,
        },
      },
      _sum: {
        score: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      take: limit,
    });

    // Get user details
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      leaderboard.map(
        async (entry: {
          user_id: string | null;
          _sum: { score: number | null };
          _count: number;
        }) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const user = await prisma.users.findUnique({
            where: { id: entry.user_id || '' },
            select: { username: true },
          });

          return {
            user_id: entry.user_id || '',
            username: user?.username || 'Unknown',
            total_score: entry._sum.score || 0,
            total_plays: entry._count,
          };
        },
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }
}
