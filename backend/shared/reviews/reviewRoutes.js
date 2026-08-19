import express from "express";
import * as reviewController from "./reviewController.js";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { validate } from "../../middleware/validate.js";
import { restaurantReviewSchema, riderReviewSchema } from "./reviewSchemas.js";

const router = express.Router();
const customerRole = "customer";
const riderRole = "rider";

router.post(
  "/restaurant",
  authorization,
  authorizeRoles(customerRole),
  validate(restaurantReviewSchema),
  reviewController.submitRestaurantReview
);

router.post(
  "/rider",
  authorization,
  authorizeRoles(customerRole),
  validate(riderReviewSchema),
  reviewController.submitRiderReview
);

router.get("/restaurant/:restaurantId", reviewController.getRestaurantReviews);

router.get("/my-reviews", authorization, authorizeRoles(riderRole), reviewController.getRiderReviews);

export default router;
