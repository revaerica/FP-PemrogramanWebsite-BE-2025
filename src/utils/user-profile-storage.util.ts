import { type Prisma } from '@prisma/client';

import { prisma } from '@/common';

// ✅ FIX: Add index signature untuk Prisma compatibility
interface UserProfile {
  coins: number;
  ownedPendants: Record<string, number>;
  lastUpdated: string;
  [key: string]: unknown; // ⭐ Index signature
}

export abstract class UserProfileStorage {
  private static STORAGE_GAME_PREFIX = 'user-profile-storage-';

  /**
   * Get or create storage game for user
   */
  private static async getStorageGame(userId: string) {
    const storageName = `${this.STORAGE_GAME_PREFIX}${userId}`;

    let storageGame = await prisma.games.findFirst({
      where: {
        name: storageName,
        creator_id: userId,
      },
    });

    if (!storageGame) {
      const template = await prisma.gameTemplates.findUnique({
        where: { slug: 'watch-and-memorize' },
        select: { id: true },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      const defaultProfile: UserProfile = {
        coins: 0,
        ownedPendants: {},
        lastUpdated: new Date().toISOString(),
      };

      storageGame = await prisma.games.create({
        data: {
          name: storageName,
          description: 'User profile storage (invisible)',
          thumbnail_image: 'https://placeholder.com/storage.png',
          game_template_id: template.id,
          creator_id: userId,
          is_published: false,
          game_json: defaultProfile as unknown as Prisma.InputJsonValue, // ✅ Cast through unknown
          total_played: 0,
        },
      });
    }

    return storageGame;
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const storageGame = await this.getStorageGame(userId);

    // ✅ FIX: Safe type casting
    const rawProfile = storageGame.game_json;
    const profile = rawProfile as unknown as UserProfile;

    return {
      coins: profile.coins || 0,
      ownedPendants: profile.ownedPendants || {},
      lastUpdated: profile.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const storageGame = await this.getStorageGame(userId);
    const currentProfile = storageGame.game_json as unknown as UserProfile;

    const updatedProfile: UserProfile = {
      coins: updates.coins ?? currentProfile.coins ?? 0,
      ownedPendants:
        updates.ownedPendants ?? currentProfile.ownedPendants ?? {},
      lastUpdated: new Date().toISOString(),
    };

    await prisma.games.update({
      where: { id: storageGame.id },
      data: {
        game_json: updatedProfile as unknown as Prisma.InputJsonValue, // ✅ Cast through unknown
      },
    });

    return updatedProfile;
  }

  /**
   * Add coins to user
   */
  static async addCoins(userId: string, amount: number): Promise<number> {
    const profile = await this.getUserProfile(userId);
    const newCoins = profile.coins + amount;

    await this.updateUserProfile(userId, {
      coins: newCoins,
    });

    return newCoins;
  }

  /**
   * Deduct coins from user
   */
  static async deductCoins(userId: string, amount: number): Promise<number> {
    const profile = await this.getUserProfile(userId);

    if (profile.coins < amount) {
      throw new Error('Insufficient coins');
    }

    const newCoins = profile.coins - amount;

    await this.updateUserProfile(userId, {
      coins: newCoins,
    });

    return newCoins;
  }

  /**
   * Add pendant to user inventory
   */
  static async addPendant(userId: string, pendantId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    const pendants = { ...profile.ownedPendants };

    pendants[pendantId] = (pendants[pendantId] || 0) + 1;

    await this.updateUserProfile(userId, {
      ownedPendants: pendants,
    });
  }

  /**
   * Use pendant (deduct from inventory)
   */
  static async usePendant(userId: string, pendantId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    const pendants = { ...profile.ownedPendants };

    if (!pendants[pendantId] || pendants[pendantId] <= 0) {
      throw new Error('Pendant not owned or already used');
    }

    pendants[pendantId] -= 1;

    await this.updateUserProfile(userId, {
      ownedPendants: pendants,
    });
  }
}
