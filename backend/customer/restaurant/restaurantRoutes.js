import express from "express";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/athorizeRoles.js";
import {
  getNearbyRestaurants,
  getRestaurants,
  getCategories,
  getMenus,
  getMenuItem,
  getRestaurant,
  getRestaurantByLocation,
  getReviewsAll,
  getRestaurantsSearchByName,
  toggleFavoriteRestaurant,
} from "./restaurantController.js";
import { getIndividualMenuReview } from "../../restaurants/profile/restaurantProfileController.js";

const router = express.Router();
const role = "customer";

router.get(
  "/nearby_restaurants",
  authorization,
  authorizeRoles(role),
  getNearbyRestaurants
);

router.post(
  "/restaurant/:id/favorite",
  authorization,
  authorizeRoles(role),
  toggleFavoriteRestaurant
);
router.get("/getRestaurants", getRestaurants);
router.get("/getCategories", getCategories);
router.get("/menus", getMenus);
router.get("/menu/:id", getMenuItem);
router.get("/getRestaurant/:id", getRestaurant);
router.get("/get_restaurant_by_location", getRestaurantByLocation);
router.get("/reviews", getReviewsAll);
router.get("/searchRestaurant", getRestaurantsSearchByName);

export default router;
