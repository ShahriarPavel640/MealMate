import express, { Request } from 'express';
import authorization from '../../middleware/authorization.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { cacheMiddleware } from '../../middleware/cacheMiddleware.js';
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
} from './restaurantController.js';

const router = express.Router();
const role = 'customer';

router.get(
  '/nearby_restaurants',
  authorization,
  authorizeRoles(role),
  cacheMiddleware(
    (req: Request) =>
      `cache:restaurants:nearby:${req.user!.id}:${(req.query.page as string) || 1}:${(req.query.limit as string) || 9}`
  ),
  getNearbyRestaurants
);

router.post(
  '/restaurant/:id/favorite',
  authorization,
  authorizeRoles(role),
  toggleFavoriteRestaurant
);

router.get(
  '/getRestaurants',
  cacheMiddleware(
    (req: Request) =>
      `cache:restaurants:all:${(req.query.page as string) || 1}:${(req.query.limit as string) || 9}`
  ),
  getRestaurants
);

router.get(
  '/getCategories',
  cacheMiddleware(() => `cache:categories`),
  getCategories
);

router.get('/menus', getMenus);
router.get('/menu/:id', getMenuItem);

router.get(
  '/getRestaurant/:id',
  cacheMiddleware((req: Request) => `cache:restaurant:${req.params.id as string}`),
  getRestaurant
);

router.get('/get_restaurant_by_location', getRestaurantByLocation);

router.get(
  '/reviews',
  cacheMiddleware(
    (req: Request) => `cache:reviews:${(req.query.restaurant_id as string) || req.user?.id}`
  ),
  getReviewsAll
);

router.get(
  '/searchRestaurant',
  cacheMiddleware(
    (req: Request) =>
      `cache:restaurants:search:${(req.query.name as string) || ''}:${(req.query.page as string) || 1}:${(req.query.limit as string) || 9}`
  ),
  getRestaurantsSearchByName
);

export default router;
