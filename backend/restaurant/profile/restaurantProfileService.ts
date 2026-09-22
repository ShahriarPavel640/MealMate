import { Prisma } from '@prisma/client';
import prisma from '@/prismaClient.js';
import bcrypt from 'bcrypt';
import { AppError } from '@/middleware/errorHandler.js';
import redisClient from '@/utils/redisClient.js';

import { z } from 'zod';
import { restaurantRegisterSchema, addMenuSchema, editProfileSchema } from './restaurantProfileSchemas.js';

export const registerRestaurant = async (data: z.infer<typeof restaurantRegisterSchema>) => {
  const {
    name,
    email,
    password,
    phone,
    phone_number,
    latitude,
    longitude,
    street,
    city,
    postal_code,
  } = data;
  const phoneNumber = phone || phone_number || null;

  const existing = await prisma.restaurants.findFirst({
    where: { email },
  });

  if (existing) {
    throw new AppError('restaurant already exists', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let locationId = null;

    if (latitude != null && longitude != null) {
      const location = await tx.user_locations.create({
        data: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          street: street || null,
          city: city || null,
          postal_code: postal_code || null,
        },
      });
      locationId = location.location_id;
    }

    const restaurant = await tx.restaurants.create({
      data: {
        name,
        phone: phoneNumber,
        email,
        password: hashedPassword,
        location_id: locationId,
      },
    });

    if (locationId) {
      await tx.user_locations.update({
        where: { location_id: locationId },
        data: { restaurant_id: restaurant.restaurant_id },
      });
    }

    return restaurant;
  });
};

export const loginRestaurant = async (email: string, password: string) => {
  const restaurant = await prisma.restaurants.findFirst({
    where: { email },
  });

  if (!restaurant) {
    throw new AppError('user not found. check your email.', 401);
  }

  const isValid = await bcrypt.compare(password, restaurant.password);
  if (!isValid) {
    throw new AppError('invalid credentials', 401);
  }

  return restaurant;
};

export const getRestaurantById = async (restaurantId: number) => {
  const restaurant = await prisma.restaurants.findUnique({
    where: { restaurant_id: restaurantId },
  });
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }
  return restaurant;
};

export const getRestaurantFullProfile = async (restaurantId: number) => {
  const restaurant = await prisma.restaurants.findUnique({
    where: { restaurant_id: restaurantId },
    include: {
      user_locations_restaurants_location_idTouser_locations: true,
      restaurant_hours: true,
    },
  });

  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  const loc = restaurant.user_locations_restaurants_location_idTouser_locations;
  const dayOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const sortedHours = (restaurant.restaurant_hours || []).sort(
    (a: {day_of_week: string}, b: {day_of_week: string}) =>
      ((dayOrder as Record<string, number>)[a.day_of_week] || 8) - ((dayOrder as Record<string, number>)[b.day_of_week] || 8)
  );

  return {
    restaurant_id: restaurant.restaurant_id,
    restaurant_name: restaurant.name,
    name: restaurant.name,
    image_url: restaurant.image_url,
    rating: restaurant.average_rating ? Number(restaurant.average_rating) : 0,
    average_rating: restaurant.average_rating ? Number(restaurant.average_rating) : 0,
    phone: restaurant.phone,
    description: restaurant.descriptions,
    descriptions: restaurant.descriptions,
    email: restaurant.email,
    street: loc?.street || '',
    city: loc?.city || '',
    postal_code: loc?.postal_code || '',
    longitude: loc?.longitude ? Number(loc.longitude) : null,
    latitude: loc?.latitude ? Number(loc.latitude) : null,
    created_at: restaurant.created_at,
    operating_hours: sortedHours,
  };
};

export const updateRestaurantProfile = async (restaurantId: number, profileData: z.infer<typeof editProfileSchema>, newImageUrl?: string) => {
  const {
    restaurant_name,
    name,
    phone,
    description,
    latitude,
    longitude,
    street,
    city,
    postal_code,
    operating_hours,
  } = profileData;

  const currentRestaurant = await prisma.restaurants.findUnique({
    where: { restaurant_id: restaurantId },
  });

  if (!currentRestaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  const finalName = restaurant_name || name || currentRestaurant.name;
  const finalPhone = phone !== undefined ? phone : currentRestaurant.phone;
  const finalDesc = description !== undefined ? description : currentRestaurant.descriptions;
  const finalImage = newImageUrl !== undefined ? newImageUrl : currentRestaurant.image_url;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let locationId = currentRestaurant.location_id;

    if (latitude != null && longitude != null) {
      if (locationId) {
        await tx.user_locations.update({
          where: { location_id: locationId },
          data: {
            latitude: Number(latitude),
            longitude: Number(longitude),
            street: street || undefined,
            city: city || undefined,
            postal_code: postal_code || undefined,
          },
        });
      } else {
        const newLoc = await tx.user_locations.create({
          data: {
            restaurant_id: restaurantId,
            latitude: Number(latitude),
            longitude: Number(longitude),
            street: street || null,
            city: city || null,
            postal_code: postal_code || null,
          },
        });
        locationId = newLoc.location_id;
      }
    }

    const updated = await tx.restaurants.update({
      where: { restaurant_id: restaurantId },
      data: {
        name: finalName,
        phone: finalPhone,
        descriptions: finalDesc,
        image_url: finalImage,
        location_id: locationId,
      },
    });

    if (Array.isArray(operating_hours) && operating_hours.length > 0) {
      await tx.restaurant_hours.deleteMany({
        where: { restaurant_id: restaurantId },
      });

      for (const h of operating_hours) {
        if (h.day_of_week) {
          await tx.restaurant_hours.create({
            data: {
              restaurant_id: restaurantId,
              day_of_week: h.day_of_week,
              open_time: h.open_time ? new Date(`1970-01-01T${h.open_time}Z`) : null,
              close_time: h.close_time ? new Date(`1970-01-01T${h.close_time}Z`) : null,
            },
          });
        }
      }
    }

    return updated;
  });
};

export const changeRestaurantPassword = async (restaurantId: number, prevPassword: string, newPassword: string) => {
  const restaurant = await prisma.restaurants.findUnique({
    where: { restaurant_id: restaurantId },
  });

  if (!restaurant) {
    throw new AppError('restaurant not found', 404);
  }

  const isValid = await bcrypt.compare(prevPassword, restaurant.password);
  if (!isValid) {
    throw new AppError('invalid credentials', 401);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  return await prisma.restaurants.update({
    where: { restaurant_id: restaurantId },
    data: { password: hashedPassword },
  });
};

export const addMenuItemWithImage = async (restaurantId: number, itemData: z.infer<typeof addMenuSchema>, imageUrl?: string) => {
  const { category, name, description, price, is_available, discount } = itemData;

  let menuCategory = await prisma.menu_categories.findFirst({
    where: {
      restaurant_id: restaurantId,
      name: category.trim(),
    },
  });

  if (!menuCategory) {
    menuCategory = await prisma.menu_categories.create({
      data: {
        restaurant_id: restaurantId,
        name: category.trim(),
      },
    });
  }

  const newItem = await prisma.menu_items.create({
    data: {
      category_id: menuCategory.category_id,
      name,
      description: description || null,
      price: Number(price),
      is_available: is_available !== undefined ? Boolean(is_available) : true,
      discount: discount ? Number(discount) : null,
      menu_item_image_url:
        imageUrl ||
        'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop',
    },
    include: {
      menu_categories: true,
    },
  });

  if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${restaurantId}`);

  return {
    menu_item_id: newItem.menu_item_id,
    category_id: newItem.category_id,
    name: newItem.name,
    description: newItem.description,
    price: newItem.price,
    is_available: newItem.is_available,
    menu_item_image_url: newItem.menu_item_image_url,
    discount: newItem.discount,
    category_name: newItem.menu_categories?.name,
    category_image: newItem.menu_categories?.menu_category_image_url,
  };
};

export const editMenuItemWithImage = async (restaurantId: number, menuItemIdRaw: number, itemData: Partial<z.infer<typeof addMenuSchema>> & { menu_item_image_url?: string }, newImageUrl?: string) => {
  const menuItemId = menuItemIdRaw;
  const { name, category, description, price, is_available, discount, menu_item_image_url } =
    itemData;

  const item = await prisma.menu_items.findUnique({
    where: { menu_item_id: menuItemId },
    include: { menu_categories: true },
  });

  if (!item || item.menu_categories?.restaurant_id !== restaurantId) {
    throw new AppError('Menu item not found or not authorized', 404);
  }

  let categoryId = item.category_id;
  if (category && category.trim() !== item.menu_categories?.name) {
    let menuCategory = await prisma.menu_categories.findFirst({
      where: {
        restaurant_id: restaurantId,
        name: category.trim(),
      },
    });

    if (!menuCategory) {
      menuCategory = await prisma.menu_categories.create({
        data: {
          restaurant_id: restaurantId,
          name: category.trim(),
        },
      });
    }
    categoryId = menuCategory.category_id;
  }

  const finalImageUrl =
    newImageUrl !== undefined ? newImageUrl : menu_item_image_url || item.menu_item_image_url;

  const updatedItem = await prisma.menu_items.update({
    where: { menu_item_id: menuItemId },
    data: {
      name: name !== undefined ? name : item.name,
      category_id: categoryId,
      description: description !== undefined ? description : item.description,
      price: price !== undefined ? Number(price) : item.price,
      is_available: is_available !== undefined ? Boolean(is_available) : item.is_available,
      discount: discount !== undefined ? (discount ? Number(discount) : null) : item.discount,
      menu_item_image_url: finalImageUrl,
    },
    include: {
      menu_categories: true,
    },
  });

  if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${restaurantId}`);

  return {
    menu_item_id: updatedItem.menu_item_id,
    category_id: updatedItem.category_id,
    name: updatedItem.name,
    description: updatedItem.description,
    price: updatedItem.price,
    is_available: updatedItem.is_available,
    menu_item_image_url: updatedItem.menu_item_image_url,
    discount: updatedItem.discount,
    category_name: updatedItem.menu_categories?.name,
    category_image: updatedItem.menu_categories?.menu_category_image_url,
  };
};

export const changeMenuItemAvailability = async (restaurantId: number, menuItemIdRaw: number, status: boolean | string) => {
  const menuItemId = menuItemIdRaw;

  const item = await prisma.menu_items.findUnique({
    where: { menu_item_id: menuItemId },
    include: { menu_categories: true },
  });

  if (!item || item.menu_categories?.restaurant_id !== restaurantId) {
    throw new AppError('Menu item not found or not authorized', 404);
  }

  const updated = await prisma.menu_items.update({
    where: { menu_item_id: menuItemId },
    data: { is_available: Boolean(status) },
  });

  if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${restaurantId}`);
  return updated;
};

export const deleteMenuItemSoft = async (restaurantId: number, menuItemIdRaw: number) => {
  const menuItemId = menuItemIdRaw;

  const item = await prisma.menu_items.findUnique({
    where: { menu_item_id: menuItemId },
    include: { menu_categories: true },
  });

  if (!item || item.menu_categories?.restaurant_id !== restaurantId) {
    throw new AppError('Menu item not found or not authorized', 404);
  }

  const updated = await prisma.menu_items.update({
    where: { menu_item_id: menuItemId },
    data: { is_active: false },
  });

  if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${restaurantId}`);
  return updated;
};

export const getMenuItems = async (restaurantId: number) => {
  const items = await prisma.menu_items.findMany({
    where: {
      is_active: true,
      menu_categories: {
        restaurant_id: restaurantId,
      },
    },
    include: {
      menu_categories: true,
    },
    orderBy: {
      menu_item_id: 'asc',
    },
  });

  return items.map((item) => ({
    menu_item_id: item.menu_item_id,
    category_id: item.category_id,
    name: item.name,
    description: item.description,
    price: item.price,
    is_available: item.is_available,
    menu_item_image_url: item.menu_item_image_url,
    discount: item.discount,
    category_name: item.menu_categories?.name,
    category_image: item.menu_categories?.menu_category_image_url,
  }));
};

export const getMenuCategories = async (restaurantId: number) => {
  const categories = await prisma.menu_categories.findMany({
    where: {
      restaurant_id: restaurantId,
      menu_items: {
        some: { is_active: true },
      },
    },
    select: { name: true },
    distinct: ['name'],
  });

  const categoryNames = categories.map((c) => c.name);
  categoryNames.unshift('All');
  return categoryNames;
};

export const getRestaurantReviews = async (restaurantId: number, { page = 1, limit = 10 }: {page?: number|string, limit?: number|string}) => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  const where = { restaurant_id: restaurantId };

  const [totalItems, reviews] = await Promise.all([
    prisma.reviews.count({ where }),
    prisma.reviews.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limitNum,
      include: {
        users: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limitNum);

  return {
    data: reviews.map((r) => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user_name: r.users?.name || 'Anonymous',
    })),
    pagination: {
      totalItems,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};
