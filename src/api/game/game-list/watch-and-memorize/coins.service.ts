import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';

export abstract class CoinsService {
  private static readonly coinsKey = 'user_coins';

  // Get user coins balance
  static async getUserCoins(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'User not found');
    }

    const coins = await this.getCoinsFromMetadata(userId);

    return {
      userId: user.id,
      username: user.username,
      coins,
    };
  }

  // Add coins to user (called after game completion)
  static async addCoins(userId: string, amount: number) {
    if (amount <= 0) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Amount must be positive',
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'User not found');
    }

    const currentCoins = await this.getCoinsFromMetadata(userId);
    const newBalance = currentCoins + amount;

    await this.setCoinsToMetadata(userId, newBalance);

    return {
      userId: user.id,
      coinsAdded: amount,
      newBalance,
    };
  }

  // Deduct coins from user (called when buying pendant)
  static async deductCoins(userId: string, amount: number) {
    if (amount <= 0) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Amount must be positive',
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'User not found');
    }

    const currentCoins = await this.getCoinsFromMetadata(userId);

    if (currentCoins < amount) {
      throw new ErrorResponse(StatusCodes.BAD_REQUEST, 'Insufficient coins');
    }

    const newBalance = currentCoins - amount;
    await this.setCoinsToMetadata(userId, newBalance);

    return {
      userId: user.id,
      coinsDeducted: amount,
      newBalance,
    };
  }

  // Private helper: Get coins from metadata (stored in a special game record)
  private static async getCoinsFromMetadata(userId: string): Promise<number> {
    try {
      const coinsGame = await prisma.games.findFirst({
        where: {
          creator_id: userId,
          name: `__USER_COINS_${userId}__`,
        },
        select: {
          game_json: true,
        },
      });

      if (coinsGame && coinsGame.game_json) {
        const json = coinsGame.game_json as Record<string, number>;

        return json.coins || 0;
      }

      return 0; // Default coins if not found
    } catch (error) {
      console.error('Error getting coins metadata:', error);

      return 0;
    }
  }

  // Private helper: Set coins to metadata
  private static async setCoinsToMetadata(
    userId: string,
    coins: number,
  ): Promise<void> {
    try {
      const coinsGame = await prisma.games.findFirst({
        where: {
          creator_id: userId,
          name: `__USER_COINS_${userId}__`,
        },
        select: { id: true },
      });

      if (coinsGame) {
        await prisma.games.update({
          where: { id: coinsGame.id },
          data: {
            game_json: { coins },
          },
        });
      } else {
        // Create game metadata if not exists
        const template = await prisma.gameTemplates.findUnique({
          where: { slug: 'watch-and-memorize' },
          select: { id: true },
        });

        if (!template) {
          throw new ErrorResponse(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Game template not found',
          );
        }

        await prisma.games.create({
          data: {
            name: `__USER_COINS_${userId}__`,
            description: 'User coins metadata storage',
            thumbnail_image: '',
            game_template_id: template.id,
            creator_id: userId,
            game_json: { coins },
            is_published: false,
          },
        });
      }
    } catch (error) {
      console.error('Error setting coins metadata:', error);
      // Fail gracefully
    }
  }
}
