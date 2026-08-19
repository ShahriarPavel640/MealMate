import prisma from "../../prismaClient.js";

export const addMenuCategory = async (restaurantId, categoryName) => {
  return await prisma.menu_categories.create({
    data: {
      restaurant_id: restaurantId,
      name: categoryName,
    },
  });
};

export const updateMenuCategory = async (categoryId, newCategoryName) => {
  return await prisma.menu_categories.update({
    where: { category_id: categoryId },
    data: {
      name: newCategoryName,
    },
  });
};

export const deleteMenuCategory = async (categoryId) => {
  return await prisma.menu_categories.delete({
    where: { category_id: categoryId },
  });
};

export const addMenuItem = async (categoryId, name, description, price) => {
  return await prisma.menu_items.create({
    data: {
      category_id: categoryId,
      name,
      description,
      price,
    },
  });
};

export const updateMenuItem = async (menuItemId, updatedFields) => {
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

export const deleteMenuItem = async (menuItemId) => {
  return await prisma.menu_items.delete({
    where: { menu_item_id: menuItemId },
  });
};
