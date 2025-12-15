import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';
import { UserProfileStorage } from '@/utils';

export abstract class CoinsService {
  // Get user coins balance
  static async getUserCoins(userId: string) {
    try {
      const profile = await UserProfileStorage.getUserProfile(userId);

      // Get user info
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

      return {
        userId: user.id,
        username: user.username,
        coins: profile.coins,
      };
    } catch {
      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get user coins',
      );
    }
  }

  // Add coins to user (called after game completion)
  static async addCoins(userId: string, amount: number) {
    if (amount <= 0) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Amount must be positive',
      );
    }

    try {
      const newBalance = await UserProfileStorage.addCoins(userId, amount);

      return {
        userId,
        coinsAdded: amount,
        newBalance,
      };
    } catch {
      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to add coins',
      );
    }
  }

  // Deduct coins from user (called when buying pendant)
  static async deductCoins(userId: string, amount: number) {
    if (amount <= 0) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Amount must be positive',
      );
    }

    try {
      const profile = await UserProfileStorage.getUserProfile(userId);

      if (profile.coins < amount) {
        throw new ErrorResponse(StatusCodes.BAD_REQUEST, 'Insufficient coins');
      }

      const newBalance = await UserProfileStorage.deductCoins(userId, amount);

      return {
        userId,
        coinsDeducted: amount,
        newBalance,
      };
    } catch (error: unknown) {
      // ⭐ FIX: Ganti any jadi unknown
      if (error instanceof ErrorResponse) {
        throw error;
      }

      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to deduct coins',
      );
    }
  }
}
