import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ErrorResponse, type IGroupSortJson, prisma } from '@/common';
import { FileManager } from '@/utils';

import {
  type ICheckAnswer,
  type ICreateGroupSort,
  type IUpdateGroupSort,
} from './schema';

export abstract class GroupSortService {
  private static groupSortSlug = 'group-sort';

  static async createGroupSort(data: ICreateGroupSort, user_id: string) {
    await this.existGameCheck(data.name);

    const newGameId = v4();
    const gameTemplateId = await this.getGameTemplateId();

    let itemWithImageAmount = 0;

    for (const category of data.categories) {
      for (const item of category.items) {
        if (typeof item.item_image_array_index === 'number') {
          itemWithImageAmount++;
        }
      }
    }

    if (
      data.files_to_upload &&
      itemWithImageAmount !== data.files_to_upload.length
    )
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'All uploaded files must be used',
      );

    // Convert thumbnail to base64
    const thumbnailImagePath = await FileManager.upload(
      `game/group-sort/${newGameId}`,
      data.thumbnail_image,
    );

    // Convert all item images to base64
    const imageArray: string[] = [];

    if (data.files_to_upload) {
      for (const image of data.files_to_upload) {
        const base64Image = await FileManager.upload(
          `game/group-sort/${newGameId}`,
          image,
        );
        imageArray.push(base64Image);
      }
    }

    const groupSortJson: IGroupSortJson = {
      score_per_item: data.score_per_item,
      time_limit: data.time_limit,
      is_category_randomized: data.is_category_randomized,
      is_item_randomized: data.is_item_randomized,
      categories: data.categories.map(category => ({
        category_name: category.category_name,
        items: category.items.map(item => ({
          item_text: item.item_text,
          item_image:
            typeof item.item_image_array_index === 'number'
              ? imageArray[item.item_image_array_index]
              : null,
          item_hint: item.item_hint || undefined,
        })),
      })),
    };

    const newGame = await prisma.games.create({
      data: {
        id: newGameId,
        game_template_id: gameTemplateId,
        creator_id: user_id,
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_publish_immediately,
        game_json: groupSortJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return newGame;
  }

  static async getGroupSortGameDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findFirst({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        creator_id: true,
        game_json: true,
      },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to access this game',
      );

    const gameJson = game.game_json as unknown as IGroupSortJson;

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      is_published: game.is_published,
      score_per_item: gameJson.score_per_item,
      time_limit: gameJson.time_limit,
      is_category_randomized: gameJson.is_category_randomized,
      is_item_randomized: gameJson.is_item_randomized,
      categories: gameJson.categories.map(cat => ({
        category_name: cat.category_name,
        items: cat.items.map(item => ({
          item_text: item.item_text,
          item_image: item.item_image,
          item_hint: item.item_hint,
        })),
      })),
    };
  }

  static async updateGroupSort(
    game_id: string,
    data: IUpdateGroupSort,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: { creator_id: true, game_json: true, thumbnail_image: true },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to edit this game',
      );

    let thumbnailImagePath: string | undefined;

    if (data.thumbnail_image) {
      // Convert new thumbnail to base64 (no need to delete old one, it's in DB)
      thumbnailImagePath = await FileManager.upload(
        `game/group-sort/${game_id}`,
        data.thumbnail_image,
      );
    }

    let updatedGameJson: IGroupSortJson | undefined;

    if (data.categories) {
      const gameJson = game.game_json as unknown as IGroupSortJson;

      let itemWithImageAmount = 0;

      for (const category of data.categories) {
        for (const item of category.items) {
          if (typeof item.item_image_array_index === 'number') {
            itemWithImageAmount++;
          }
        }
      }

      if (
        data.files_to_upload &&
        itemWithImageAmount !== data.files_to_upload.length
      )
        throw new ErrorResponse(
          StatusCodes.BAD_REQUEST,
          'All uploaded files must be used',
        );

      // Convert all images to base64
      const imageArray: string[] = [];

      if (data.files_to_upload) {
        for (const image of data.files_to_upload) {
          const base64Image = await FileManager.upload(
            `game/group-sort/${game_id}`,
            image,
          );
          imageArray.push(base64Image);
        }
      }

      updatedGameJson = {
        score_per_item: data.score_per_item ?? gameJson.score_per_item,
        time_limit: data.time_limit ?? gameJson.time_limit,
        is_category_randomized:
          data.is_category_randomized ?? gameJson.is_category_randomized,
        is_item_randomized:
          data.is_item_randomized ?? gameJson.is_item_randomized,
        categories: data.categories.map(category => ({
          category_name: category.category_name,
          items: category.items.map(item => {
            let itemImage: string | null = null;

            // Handle three cases:
            // 1. New file upload: item_image_array_index is a number (index in imageArray)
            if (typeof item.item_image_array_index === 'number') {
              itemImage = imageArray[item.item_image_array_index];
            }
            // 2. Existing image preserved: item_image_array_index is a string (path)
            else if (typeof item.item_image_array_index === 'string') {
              itemImage = item.item_image_array_index;
            }

            return {
              item_text: item.item_text,
              item_image: itemImage,
              item_hint: item.item_hint || undefined,
            };
          }),
        })),
      };
    }

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: {
        name: data.name,
        description: data.description,
        ...(thumbnailImagePath !== undefined && {
          thumbnail_image: thumbnailImagePath,
        }),
        is_published: data.is_publish,
        game_json: updatedGameJson
          ? (updatedGameJson as unknown as Prisma.InputJsonValue)
          : undefined,
      },
      select: { id: true },
    });

    return updatedGame;
  }

  static async deleteGroupSort(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: { creator_id: true },
    });

    if (!game) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );
    }

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to delete this game',
      );

    await prisma.games.delete({
      where: { id: game_id },
    });

    return { success: true };
  }

  static async publishGame(game_id: string, user_id: string, user_role: ROLE) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        creator_id: true,
        game_template: { select: { slug: true } },
      },
    });

    if (!game || game.game_template.slug !== this.groupSortSlug) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );
    }

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot publish this game',
      );

    const publishedGame = await prisma.games.update({
      where: { id: game_id },
      data: { is_published: true },
      select: { id: true },
    });

    return publishedGame;
  }

  static async unpublishGame(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        creator_id: true,
        game_template: { select: { slug: true } },
      },
    });

    if (!game || game.game_template.slug !== this.groupSortSlug) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );
    }

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot unpublish this game',
      );

    const unpublishedGame = await prisma.games.update({
      where: { id: game_id },
      data: { is_published: false },
      select: { id: true },
    });

    return unpublishedGame;
  }

  static async getGroupSortPlay(
    game_id: string,
    isPublic: boolean,
    user_id?: string,
  ) {
    const game = await prisma.games.findFirst({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        creator_id: true,
        game_json: true,
      },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    if (isPublic && !game.is_published) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );
    }

    if (!isPublic && game.creator_id !== user_id) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You are not authorized to access this game',
      );
    }

    const gameJson = game.game_json as unknown as IGroupSortJson;

    const categoriesWithIds = gameJson.categories.map((cat, catIndex) => ({
      id: `cat-${catIndex}`,
      name: cat.category_name,
      items: cat.items.map((item, itemIndex) => ({
        id: `item-${catIndex}-${itemIndex}`,
        text: item.item_text,
        image: item.item_image,
        hint: item.item_hint || undefined,
      })),
    }));

    let finalCategories = categoriesWithIds;

    if (gameJson.is_category_randomized) {
      finalCategories = [...categoriesWithIds].sort(() => Math.random() - 0.5);
    }

    if (gameJson.is_item_randomized) {
      finalCategories = finalCategories.map(cat => ({
        ...cat,
        items: [...cat.items].sort(() => Math.random() - 0.5),
      }));
    }

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      is_published: game.is_published,
      game_data: {
        categories: finalCategories,
        timeLimit: gameJson.time_limit,
        scorePerItem: gameJson.score_per_item,
      },
    };
  }

  static async checkAnswer(game_id: string, data: ICheckAnswer) {
    const game = await prisma.games.findFirst({
      where: {
        id: game_id,
        is_published: true,
      },
      select: {
        id: true,
        game_json: true,
      },
    });

    if (!game)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort game not found',
      );

    const gameJson = game.game_json as unknown as IGroupSortJson;

    // Calculate total items from all categories
    let totalItemsInGame = 0;

    for (const cat of gameJson.categories) {
      totalItemsInGame += cat.items.length;
    }

    const categoryMap = new Map<string, number>();

    for (const [catIndex, cat] of gameJson.categories.entries()) {
      for (const [itemIndex] of cat.items.entries()) {
        categoryMap.set(`item-${catIndex}-${itemIndex}`, catIndex);
      }
    }

    let correctCount = 0;

    for (const answer of data.answers) {
      const correctCategoryIndex = categoryMap.get(answer.item_id);
      const answerCategoryIndex = Number.parseInt(
        answer.category_id.replace('cat-', ''),
      );

      if (correctCategoryIndex === answerCategoryIndex) {
        correctCount++;
      }
    }

    const score = correctCount * gameJson.score_per_item;
    const maxScore = totalItemsInGame * gameJson.score_per_item;
    const percentage =
      totalItemsInGame > 0 ? (correctCount / totalItemsInGame) * 100 : 0;

    return {
      correct_count: correctCount,
      total_count: totalItemsInGame,
      score,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  private static async getGameTemplateId() {
    const gameTemplate = await prisma.gameTemplates.findUnique({
      where: {
        slug: this.groupSortSlug,
      },
      select: {
        id: true,
      },
    });

    if (!gameTemplate)
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Group Sort template not found',
      );

    return gameTemplate.id;
  }

  private static async existGameCheck(name: string) {
    const existingGame = await prisma.games.findFirst({
      where: {
        name,
      },
    });

    if (existingGame)
      throw new ErrorResponse(
        StatusCodes.CONFLICT,
        'Game with this name already exists',
      );
  }
}
