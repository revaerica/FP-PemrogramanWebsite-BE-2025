import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';

import { CoinsService } from './coins.service';

interface IPendantItem {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
}

export abstract class PendantService {
  private static readonly pendantKey = 'user_pendants';

  // Get all available pendants (public)
  static getAvailablePendants(): IPendantItem[] {
    // Power-up pendants - sesuai dengan Pendant.tsx di FE
    const pendants: IPendantItem[] = [
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

    return pendants;
  }

  // Get user's owned pendants
  static async getUserPendants(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Get owned pendants from metadata
    const ownedPendants = await this.getPendantsFromMetadata(userId);

    // Get available pendants list
    const availablePendants = this.getAvailablePendants();

    // Map to include quantity for each pendant
    const pendantsWithQuantity = availablePendants.map(pendant => ({
      ...pendant,
      owned: ownedPendants[pendant.id] || 0,
    }));

    return {
      userId: user.id,
      pendants: pendantsWithQuantity,
    };
  }

  // Purchase pendant (can buy multiple times)
  static async purchasePendant(userId: string, pendantId: string) {
    // Get available pendants
    const availablePendants = this.getAvailablePendants();
    const pendant = availablePendants.find(p => p.id === pendantId);

    if (!pendant) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Pendant not found');
    }

    // Deduct coins
    await CoinsService.deductCoins(userId, pendant.price);

    // Get current pendants
    const currentPendants = await this.getPendantsFromMetadata(userId);

    // Update pendant quantity (increment by 1)
    const updatedPendants = {
      ...currentPendants,
      [pendantId]: (currentPendants[pendantId] || 0) + 1,
    };

    await this.setPendantsToMetadata(userId, updatedPendants);

    return {
      success: true,
      pendantId,
      pendantName: pendant.name,
      coinsSpent: pendant.price,
      newQuantity: updatedPendants[pendantId],
      message: `Successfully purchased ${pendant.name}!`,
    };
  }

  // Use pendant (decrement quantity)
  static async usePendant(userId: string, pendantId: string) {
    const pendants = await this.getPendantsFromMetadata(userId);

    if (!pendants[pendantId] || pendants[pendantId] <= 0) {
      throw new ErrorResponse(StatusCodes.BAD_REQUEST, 'Pendant not available');
    }

    const updated = {
      ...pendants,
      [pendantId]: pendants[pendantId] - 1,
    };

    await this.setPendantsToMetadata(userId, updated);

    return {
      success: true,
      pendantId,
      remainingQuantity: updated[pendantId],
    };
  }

  // Private helper: Get pendants from metadata
  private static async getPendantsFromMetadata(
    userId: string,
  ): Promise<Record<string, number>> {
    try {
      const pendantGame = await prisma.games.findFirst({
        where: {
          creator_id: userId,
          name: `__USER_PENDANTS_${userId}__`,
        },
        select: {
          game_json: true,
        },
      });

      if (pendantGame && pendantGame.game_json) {
        const json = pendantGame.game_json as Record<
          string,
          Record<string, number>
        >;

        return json.pendants || {};
      }

      return {}; // Default empty pendants
    } catch (error) {
      console.error('Error getting pendants metadata:', error);

      return {};
    }
  }

  // Private helper: Set pendants to metadata
  private static async setPendantsToMetadata(
    userId: string,
    pendants: Record<string, number>,
  ): Promise<void> {
    try {
      const pendantGame = await prisma.games.findFirst({
        where: {
          creator_id: userId,
          name: `__USER_PENDANTS_${userId}__`,
        },
        select: { id: true },
      });

      if (pendantGame) {
        await prisma.games.update({
          where: { id: pendantGame.id },
          data: {
            game_json: { pendants },
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
            name: `__USER_PENDANTS_${userId}__`,
            description: 'User pendants metadata storage',
            thumbnail_image: '',
            game_template_id: template.id,
            creator_id: userId,
            game_json: { pendants },
            is_published: false,
          },
        });
      }
    } catch (error) {
      console.error('Error setting pendants metadata:', error);
    }
  }
}
