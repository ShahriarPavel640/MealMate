import express from 'express';
import * as reviewController from './reviewController.js';
import authorization from '../../middleware/authorization.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';

const router = express.Router();
const customerRole = "customer";
const riderRole = "rider";

// Route to submit a restaurant review
router.post('/restaurant', authorization, authorizeRoles(customerRole), reviewController.submitRestaurantReview);

// Route to submit a rider review
router.post('/rider', authorization, authorizeRoles(customerRole), reviewController.submitRiderReview);

// Route to get all reviews for a specific restaurant
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Route for a rider to get their own reviews
router.get('/my-reviews', authorization, authorizeRoles(riderRole), reviewController.getRiderReviews);

export default router;
