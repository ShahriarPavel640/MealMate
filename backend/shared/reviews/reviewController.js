import * as reviewService from "./reviewService.js";

export const submitRestaurantReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await reviewService.submitRestaurantReviewService(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const submitRiderReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await reviewService.submitRiderReviewService(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const result = await reviewService.getRestaurantReviewsService(restaurantId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRiderReviews = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const result = await reviewService.getRiderReviewsService(riderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
