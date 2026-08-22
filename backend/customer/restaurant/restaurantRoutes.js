import express from "express";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { cacheMiddleware } from "../../middleware/cacheMiddleware.js";
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

const router = express.Router();
const role = "customer";

router.get(
  "/nearby_restaurants",
  authorization,
  authorizeRoles(role),
  cacheMiddleware((req) => `cache:restaurants:nearby:${req.user.id}:${req.query.page||1}:${req.query.limit||9}`),
  getNearbyRestaurants
);

router.post(
  "/restaurant/:id/favorite",
  authorization,
  authorizeRoles(role),
  toggleFavoriteRestaurant
);

router.get(
  "/getRestaurants",
  cacheMiddleware((req) => `cache:restaurants:all:${req.query.page||1}:${req.query.limit||9}`),
  getRestaurants
);

router.get(
  "/getCategories",
  cacheMiddleware(() => `cache:categories`),
  getCategories
);

router.get("/menus", getMenus);
router.get("/menu/:id", getMenuItem);

router.get(
  "/getRestaurant/:id",
  cacheMiddleware((req) => `cache:restaurant:${req.params.id}`),
  getRestaurant
);

router.get("/get_restaurant_by_location", getRestaurantByLocation);

router.get(
  "/reviews",
  cacheMiddleware((req) => `cache:reviews:${req.query.restaurant_id || req.user?.id}`),
  getReviewsAll
);

router.get(
  "/searchRestaurant",
  cacheMiddleware((req) => `cache:restaurants:search:${req.query.name||''}:${req.query.page||1}:${req.query.limit||9}`),
  getRestaurantsSearchByName
);

export default router;

