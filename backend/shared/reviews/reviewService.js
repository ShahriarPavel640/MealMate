import prisma from "../../prismaClient.js";
import { AppError } from "../../middleware/errorHandler.js";
import redisClient from "../../utils/redisClient.js";

export const submitRestaurantReviewService = async (userId, data) => {
  const { restaurantId, orderId, rating, comment } = data;

  // Verify order belongs to user
  const order = await prisma.orders.findUnique({
    where: { order_id: orderId }
  });
  
  if (!order || order.user_id !== parseInt(userId)) {
    throw new AppError("Order not found or does not belong to you", 403);
  }

  // Check if review already exists
  const existingReview = await prisma.reviews.findFirst({
    where: { order_id: orderId, restaurant_id: restaurantId }
  });
  if (existingReview) {
    throw new AppError("You have already submitted a review for this restaurant on this order.", 409);
  }

  // Create review
  await prisma.reviews.create({
    data: {
      user_id: parseInt(userId),
      restaurant_id: restaurantId,
      order_id: orderId,
      rating,
      comment
    }
  });

  // Update average rating
  const avg = await prisma.reviews.aggregate({
    _avg: { rating: true },
    where: { restaurant_id: restaurantId }
  });
  
  if (avg._avg.rating) {
    await prisma.restaurants.update({
      where: { restaurant_id: restaurantId },
      data: { average_rating: avg._avg.rating }
    });
  }

  if (redisClient.isOpen) {
    await redisClient.del(`cache:restaurant:${restaurantId}`);
    await redisClient.del(`cache:reviews:${restaurantId}`);
  }

  return { message: "Restaurant review submitted successfully" };
};

export const submitRiderReviewService = async (userId, data) => {
  const { riderId, orderId, rating, comment } = data;

  const order = await prisma.orders.findUnique({
    where: { order_id: orderId }
  });
  
  if (!order || order.user_id !== parseInt(userId)) {
    throw new AppError("Order not found or does not belong to you", 403);
  }

  const existingReview = await prisma.reviews.findFirst({
    where: { order_id: orderId, rider_id: riderId }
  });
  if (existingReview) {
    throw new AppError("You have already submitted a review for this rider on this order.", 409);
  }

  await prisma.reviews.create({
    data: {
      user_id: parseInt(userId),
      rider_id: riderId,
      order_id: orderId,
      rating,
      comment
    }
  });

  return { message: "Rider review submitted successfully" };
};

export const getRestaurantReviewsService = async (restaurantId) => {
  const reviews = await prisma.reviews.findMany({
    where: { restaurant_id: parseInt(restaurantId) },
    orderBy: { created_at: "desc" },
    include: { users: { select: { name: true } } }
  });
  
  return reviews.map(r => ({
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    user_name: r.users?.name || "Unknown"
  }));
};

export const getRiderReviewsService = async (riderId) => {
  const reviews = await prisma.reviews.findMany({
    where: { rider_id: parseInt(riderId) },
    orderBy: { created_at: "desc" },
    include: { users: { select: { name: true } } }
  });

  const avg = await prisma.reviews.aggregate({
    _avg: { rating: true },
    where: { rider_id: parseInt(riderId) }
  });

  return {
    reviews: reviews.map(r => ({
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user_name: r.users?.name || "Unknown"
    })),
    averageRating: avg._avg.rating ? avg._avg.rating.toFixed(2) : null
  };
};
