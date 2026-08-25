import prisma from "../../prismaClient.js";
import { AppError } from "../../middleware/errorHandler.js";

export const addMenuCategory = async (restaurantId, categoryName) => {
  return await prisma.menu_categories.create({
    data: {
      restaurant_id: restaurantId,
      name: categoryName,
    },
  });
};

export const updateMenuCategory = async (restaurantId, categoryId, newCategoryName) => {
  const category = await prisma.menu_categories.findFirst({
    where: {
      category_id: categoryId,
      restaurant_id: restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found or unauthorized", 403);
  }

  return await prisma.menu_categories.update({
    where: { category_id: categoryId },
    data: {
      name: newCategoryName,
    },
  });
};

export const deleteMenuCategory = async (restaurantId, categoryId) => {
  const category = await prisma.menu_categories.findFirst({
    where: {
      category_id: categoryId,
      restaurant_id: restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found or unauthorized", 403);
  }

  return await prisma.menu_categories.delete({
    where: { category_id: categoryId },
  });
};

export const addMenuItem = async (restaurantId, categoryId, name, description, price) => {
  const category = await prisma.menu_categories.findFirst({
    where: {
      category_id: categoryId,
      restaurant_id: restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found or unauthorized", 403);
  }

  return await prisma.menu_items.create({
    data: {
      category_id: categoryId,
      name,
      description,
      price,
    },
  });
};

export const updateMenuItem = async (restaurantId, menuItemId, updatedFields) => {
  const item = await prisma.menu_items.findUnique({
    where: { menu_item_id: menuItemId },
    include: { menu_categories: true },
  });

  if (!item || item.menu_categories?.restaurant_id !== restaurantId) {
    throw new AppError("Menu item not found or unauthorized", 403);
  }

  const { name, description, price, isAvailable } = updatedFields;
  return await prisma.menu_items.update({
    where: { menu_item_id: menuItemId },
    data: {
      name,
      description,
      price,
      is_available: isAvailable,
    },
  });
};

export const deleteMenuItem = async (restaurantId, menuItemId) => {
  const item = await prisma.menu_items.findUnique({
    where: { menu_item_id: menuItemId },
    include: { menu_categories: true },
  });

  if (!item || item.menu_categories?.restaurant_id !== restaurantId) {
    throw new AppError("Menu item not found or unauthorized", 403);
  }

  return await prisma.menu_items.delete({
    where: { menu_item_id: menuItemId },
  });
};
