import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';

import { type ISubmitScore } from './schema';

/**
 * Group Sort Score Service
 * Handles score submission for Group Sort game
 * Supports both logged-in users and guest players
 */
export abstract class GroupSortScoreService {
  /**
   * Submit score to leaderboard
   * @param userId - User ID or 'guest' for guest players
   * @param scoreData - Score submission data (game_id, score, time_spent, etc)
   */
  static async submitScore(
    userId: string,
    scoreData: ISubmitScore,
  ): Promise<{ id: string; user_id: string; game_id: string; score: number }> {
    // Validate game exists and is published
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

    // Use Leaderboard table instead of non-existent gameScores
    const leaderboardEntry = await prisma.leaderboard.create({
      data: {
        user_id: userId === 'guest' ? null : userId, // Set null for guest
        game_id: scoreData.game_id,
        score: scoreData.score,
        time_taken: scoreData.time_spent,
      },
      select: {
        id: true,
        user_id: true,
        game_id: true,
        score: true,
      },
    });

    return leaderboardEntry as {
      id: string;
      user_id: string;
      game_id: string;
      score: number;
    };
  }

  /**
   * Get highest score for user on specific game
   * For guest, returns null (no personal history)
   */
  static async getHighestScore(
    userId: string,
    gameId: string,
  ): Promise<{ score: number } | null> {
    // Guest users don't have personal highest score
    if (userId === 'guest') {
      return null;
    }

    const highestScore = await prisma.leaderboard.findFirst({
      where: {
        user_id: userId,
        game_id: gameId,
      },
      orderBy: {
        score: 'desc',
      },
      select: {
        score: true,
      },
    });

    return highestScore;
  }

  /**
   * Get user game history
   * For guest, returns empty array (no personal history)
   */
  static async getUserGameHistory(
    userId: string,
    gameId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      id: string;
      score: number;
      time_taken: number | null;
      created_at: Date;
    }>
  > {
    // Guest users don't have personal history
    if (userId === 'guest') {
      return [];
    }

    const history = await prisma.leaderboard.findMany({
      where: {
        user_id: userId,
        game_id: gameId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      select: {
        id: true,
        score: true,
        time_taken: true,
        created_at: true,
      },
    });

    return history;
  }

  /**
   * Get game leaderboard (public - all players including guests)
   * Returns top scores per user, with count of total plays
   */
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
    // Get distinct users with their top scores
    const leaderboard = await prisma.leaderboard.groupBy({
      by: ['user_id'],
      where: {
        game_id: gameId,
      },
      _max: {
        score: true,
      },
      _count: {
        id: true, // Count total entries/plays per user
      },
      orderBy: {
        _max: {
          score: 'desc',
        },
      },
      take: limit,
    });

    // Map guest entries (user_id=null) and user entries with correct counts
    const results = await Promise.all(
      leaderboard.map(async entry => {
        if (entry.user_id === null) {
          // Guest entry - count all guest plays
          return {
            user_id: 'guest',
            username: 'Guest Player',
            highest_score: entry._max.score || 0,
            total_plays: entry._count.id || 0,
          };
        }

        // Logged-in user - fetch username and use count
        const user = await prisma.users.findUnique({
          where: { id: entry.user_id },
          select: { username: true },
        });

        return {
          user_id: entry.user_id,
          username: user?.username || 'Unknown',
          highest_score: entry._max.score || 0,
          total_plays: entry._count.id || 0,
        };
      }),
    );

    return results;
  }
}
