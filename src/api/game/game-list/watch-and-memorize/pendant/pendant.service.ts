import { StatusCodes } from 'http-status-codes';

import { ErrorResponse } from '@/common';
import { UserProfileStorage } from '@/utils';

import { CoinsService } from '../coins/coins.service';

export abstract class PendantService {
  // Pendant definitions (hardcoded - sesuai FE)
  private static pendants = [
    {
      id: 'hint',
      name: 'Hint Star',
      description: 'Shows one correct animal',
      price: 50,
      color: '#FFD700',
    },
    {
      id: 'freeze',
      name: 'Ice Crystal',
      description: 'Freezes time for 5 seconds',
      price: 75,
      color: '#87CEEB',
    },
    {
      id: 'double',
      name: 'Lucky Clover',
      description: 'Doubles points this round',
      price: 100,
      color: '#4CAF50',
    },
    {
      id: 'shield',
      name: 'Heart Shield',
      description: 'Protects from one wrong answer',
      price: 80,
      color: '#FF6B9D',
    },
    {
      id: 'reveal',
      name: 'Magic Eye',
      description: 'Shows all cards briefly',
      price: 120,
      color: '#B24BF3',
    },
  ];

  // Get all available pendants (public)
  static async getAvailablePendants() {
    return await Promise.resolve(this.pendants);
  }

  // Get user's owned pendants
  static async getUserPendants(userId: string) {
    try {
      const profile = await UserProfileStorage.getUserProfile(userId);

      // Map to include quantity for each pendant
      const pendantsWithQuantity = this.pendants.map(pendant => ({
        ...pendant,
        owned: profile.ownedPendants[pendant.id] || 0,
      }));

      return {
        userId,
        pendants: pendantsWithQuantity,
      };
    } catch {
      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get owned pendants',
      );
    }
  }

  // Purchase pendant (can buy multiple times)
  static async purchasePendant(userId: string, pendantId: string) {
    // Find pendant
    const pendant = this.pendants.find(p => p.id === pendantId);

    if (!pendant) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Pendant not found');
    }

    try {
      // Get current profile
      const profile = await UserProfileStorage.getUserProfile(userId);

      // Check if user has enough coins
      if (profile.coins < pendant.price) {
        throw new ErrorResponse(StatusCodes.BAD_REQUEST, 'Insufficient coins');
      }

      // Deduct coins
      await CoinsService.deductCoins(userId, pendant.price);

      // Add pendant to inventory
      await UserProfileStorage.addPendant(userId, pendantId);

      // Get new quantity
      const updatedProfile = await UserProfileStorage.getUserProfile(userId);
      const newQuantity = updatedProfile.ownedPendants[pendantId] || 1;

      return {
        success: true,
        pendantId,
        pendantName: pendant.name,
        coinsSpent: pendant.price,
        newQuantity,
        message: `Successfully purchased ${pendant.name}!`,
      };
    } catch (error: unknown) {
      // ⭐ FIX: Ganti any jadi unknown
      if (error instanceof ErrorResponse) {
        throw error;
      }

      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to purchase pendant',
      );
    }
  }
}
