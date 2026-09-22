import { restaurants, menu_items } from '@prisma/client';

interface NearbyRestaurant extends restaurants {
  distance: number | string;
  is_open: boolean;
}

interface RestaurantWithOpenStatus extends restaurants {
  is_open: boolean;
}

interface MenuItemWithDetails extends menu_items {
  created_at: Date;
  category_name: string;
  menu_category_image_url: string;
  order_count: number | string;
}

interface RestaurantHour {
  day_of_week: string;
  open_time: string;
  close_time: string;
}

interface CountResult {
  count: number | string | bigint;
}

import prisma from '@/prismaClient.js';
import { AppError } from '@/middleware/errorHandler.js';

export const getNearbyRestaurants = async (userId: number, page: number, limit: number) => {
  const radius = 5; // 5km
  const offset = (page - 1) * limit;

  // Get customer's primary location
  const userLocationResult = await prisma.$queryRaw<Array<{latitude: number, longitude: number}>>`
    SELECT latitude, longitude FROM user_locations WHERE user_id = ${userId} AND is_primary = true
  `;

  if (userLocationResult.length === 0) {
    return { data: [], total: 0 };
  }
  const userLat = userLocationResult[0].latitude;
  const userLon = userLocationResult[0].longitude;

  const restaurants = await prisma.$queryRaw<NearbyRestaurant[]>`
    SELECT 
      r.restaurant_id, r.name, r.phone, r.email, r.average_rating, r.image_url,
      get_distance_km(rl.longitude, rl.latitude, ${userLon}, ${userLat}) AS distance,
      CASE WHEN fr.id IS NOT NULL THEN true ELSE false END as is_favorite,
      (
        EXISTS (
          SELECT 1 FROM restaurant_hours rh 
          WHERE rh.restaurant_id = r.restaurant_id 
            AND rh.day_of_week::text = to_char(CURRENT_TIMESTAMP, 'Dy')
            AND CURRENT_TIME BETWEEN rh.open_time AND rh.close_time
        )
      ) AS is_open
    FROM restaurants r
    JOIN user_locations rl ON (r.location_id = rl.location_id OR (r.location_id IS NULL AND r.restaurant_id = rl.restaurant_id))
    LEFT JOIN favorite_restaurants fr ON r.restaurant_id = fr.restaurant_id AND fr.user_id = ${userId}
    WHERE get_distance_km(rl.longitude, rl.latitude, ${userLon}, ${userLat}) <= ${radius}
    ORDER BY is_open DESC, distance ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalResult = await prisma.$queryRaw<CountResult[]>`
    SELECT COUNT(*) 
    FROM restaurants r
    JOIN user_locations rl ON (r.location_id = rl.location_id OR (r.location_id IS NULL AND r.restaurant_id = rl.restaurant_id))
    WHERE get_distance_km(rl.longitude, rl.latitude, ${userLon}, ${userLat}) <= ${radius}
  `;

  return {
    data: restaurants.map((r) => ({ ...r, distance: Number(r.distance) || 0 })),
    total: Number(totalResult[0].count),
  };
};

export const getRestaurants = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const restaurants = await prisma.$queryRaw<NearbyRestaurant[]>`
    SELECT 
      r.restaurant_id, r.name, r.phone, r.email, r.average_rating, r.image_url,
      (
        EXISTS (
          SELECT 1 FROM restaurant_hours rh 
          WHERE rh.restaurant_id = r.restaurant_id 
            AND rh.day_of_week::text = to_char(CURRENT_TIMESTAMP, 'Dy')
            AND CURRENT_TIME BETWEEN rh.open_time AND rh.close_time
        )
      ) AS is_open
    FROM restaurants r
    ORDER BY is_open DESC, r.average_rating DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalResult = await prisma.$queryRaw<CountResult[]>`SELECT COUNT(*) FROM restaurants`;

  return {
    data: restaurants,
    total: Number(totalResult[0].count),
  };
};

export const getRestaurant = async (restaurantId: number) => {
  const restaurantRes = await prisma.$queryRaw<any[]>`
    SELECT
      r.restaurant_id,
      r.name AS restaurant_name,
      r.phone,
      r.email,
      r.average_rating,
      r.image_url,
      r.descriptions,
      l.street,
      l.city,
      l.postal_code,
      (
        EXISTS (
          SELECT 1 FROM restaurant_hours rh 
          WHERE rh.restaurant_id = r.restaurant_id 
            AND rh.day_of_week::text = to_char(CURRENT_TIMESTAMP, 'Dy')
            AND CURRENT_TIME BETWEEN rh.open_time AND rh.close_time
        )
      ) AS is_open
    FROM restaurants r
    LEFT JOIN user_locations l ON (r.location_id = l.location_id OR (r.location_id IS NULL AND r.restaurant_id = l.restaurant_id))
    WHERE r.restaurant_id = ${restaurantId}
  `;

  if (restaurantRes.length === 0) {
    throw new AppError('Restaurant not found', 404);
  }
  const r = restaurantRes[0];

  const menuItems = await prisma.$queryRaw<MenuItemWithDetails[]>`
    SELECT 
      mi.*, 
      mi.created_at, 
      mc.name as category_name, 
      mc.menu_category_image_url, 
      COALESCE((
        SELECT CAST(SUM(oi.quantity) AS INTEGER) 
        FROM order_items oi 
        WHERE oi.menu_item_id = mi.menu_item_id), 0) as order_count 
    FROM menu_items mi 
    JOIN menu_categories mc ON mi.category_id = mc.category_id 
    WHERE mc.restaurant_id = ${restaurantId} AND mi.is_active = true
  `;

  const address = [r.street, r.city, r.postal_code].filter(Boolean).join(', ');

  const hoursRes = await prisma.$queryRaw<RestaurantHour[]>`
    SELECT day_of_week, open_time, close_time
    FROM restaurant_hours
    WHERE restaurant_id = ${restaurantId}
    ORDER BY
      CASE
        WHEN day_of_week = 'Mon' THEN 1
        WHEN day_of_week = 'Tue' THEN 2
        WHEN day_of_week = 'Wed' THEN 3
        WHEN day_of_week = 'Thu' THEN 4
        WHEN day_of_week = 'Fri' THEN 5
        WHEN day_of_week = 'Sat' THEN 6
        WHEN day_of_week = 'Sun' THEN 7
        ELSE 8
      END
  `;

  return {
    restaruntDetails: {
      name: r.restaurant_name,
      descriptions: r.descriptions,
      restaurant_id: r.restaurant_id,
      phone: r.phone,
      email: r.email,
      rating: r.average_rating,
      reviewCount: 0,
      deliveryTime: 0,
      deliveryFee: 0,
      image: r.image_url,
      is_open: r.is_open,
      address,
      delivery_settings: {
        delivery_fee: '',
        min_order: '',
        delivery_time: '',
        delivery_radius: '',
      },
      operating_hours: hoursRes.map((h) => ({
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
      })),
    },
    menuItems: menuItems.map((item) => ({
      ...item,
      order_count: Number(item.order_count) || 0,
    })),
  };
};

export const getRestaurantByLocation = async (userLat: number, userLon: number, radiusMeters: number) => {
  const query = async (radius: number) => prisma.$queryRaw`
    SELECT 
      r.restaurant_id, r.name, r.phone, r.email, r.average_rating, r.image_url,
      ST_Distance(
        ST_MakePoint(rl.longitude, rl.latitude)::GEOGRAPHY,
        ST_MakePoint(${userLon}, ${userLat})::GEOGRAPHY
      ) AS distance
    FROM restaurants r
    JOIN user_locations rl ON (r.location_id = rl.location_id OR (r.location_id IS NULL AND r.restaurant_id = rl.restaurant_id))
    WHERE ST_DWithin(
      ST_MakePoint(rl.longitude, rl.latitude)::GEOGRAPHY,
      ST_MakePoint(${userLon}, ${userLat})::GEOGRAPHY,
      ${radius}
    )
    ORDER BY distance
    LIMIT 50
  `;

  let result = (await query(radiusMeters)) as NearbyRestaurant[];

  if (result.length === 0) {
    result = (await query(10000)) as NearbyRestaurant[]; // try 10km
  }

  return (result as NearbyRestaurant[]).map((r) => ({ ...r, distance: Number(r.distance) || 0 }));
};

export const getReviewsAll = async (restaurantId: number) => {
  const reviews = await prisma.$queryRaw`
    SELECT 
      r.review_id,
      r.rating, 
      r.comment, 
      r.created_at, 
      u.name AS user_name
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    JOIN orders o ON o.order_id = r.order_id
    WHERE r.restaurant_id = ${restaurantId}
    ORDER BY r.created_at DESC
  `;

  return reviews;
};

export const toggleFavoriteRestaurant = async (userId: number, restaurantId: number) => {
  const check = await prisma.favorite_restaurants.findFirst({
    where: {
      user_id: userId,
      restaurant_id: restaurantId,
    },
  });

  if (check) {
    await prisma.favorite_restaurants.delete({
      where: { id: check.id },
    });
    return { is_favorite: false };
  } else {
    await prisma.favorite_restaurants.create({
      data: {
        user_id: userId,
        restaurant_id: restaurantId,
      },
    });
    return { is_favorite: true };
  }
};

export const getRestaurantsSearchByName = async (rest_name: string, page: number, limit: number) => {
  const offset = (page - 1) * limit;
  const searchPattern = `%${rest_name.trim()}%`;

  const restaurants = await prisma.$queryRaw<NearbyRestaurant[]>`
    SELECT r.*,
      (
        EXISTS (
          SELECT 1 FROM restaurant_hours rh 
          WHERE rh.restaurant_id = r.restaurant_id 
            AND rh.day_of_week::text = to_char(CURRENT_TIMESTAMP, 'Dy')
            AND CURRENT_TIME BETWEEN rh.open_time AND rh.close_time
        )
      ) AS is_open
    FROM restaurants r 
    WHERE name ILIKE ${searchPattern}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalResult = await prisma.$queryRaw<CountResult[]>`SELECT COUNT(*) FROM restaurants r WHERE name ILIKE ${searchPattern}`;

  return {
    data: restaurants,
    total: Number(totalResult[0].count),
  };
};

export const getCategories = async () => {
  return await prisma.menu_categories.findMany({
    take: 30,
  });
};

export const getMenus = async () => {
  return await prisma.menu_items.findMany({
    take: 30,
  });
};

export const getMenuItem = async (id: number) => {
  const items = await prisma.menu_items.findMany({
    where: { menu_item_id: id },
  });
  if (!items || items.length === 0) throw new AppError('Menu item not found', 404);
  return items[0];
};
