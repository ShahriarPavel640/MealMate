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
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const result = await reviewService.getRestaurantReviewsService(restaurantId, skip, limit, page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRiderReviews = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const result = await reviewService.getRiderReviewsService(riderId, skip, limit, page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
