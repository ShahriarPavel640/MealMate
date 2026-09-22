import express from 'express';
import authorization from '@/middleware/authorization.js';
import authorizeRoles from '@/middleware/authorizeRoles.js';
import upload from '@/middleware/upload.js';
import { validate } from '@/middleware/validate.js';

import {
  signup as restaurant_signup,
  login as restaurant_login,
  add_menu,
  edit_menu,
  delete_menu,
  changePassword,
  logout,
  verify,
  get_menu,
  getRestaurantProfile,
  editProfile,
  get_menu_categories,
  change_menu_availability,
  getReviewsAll,
} from './restaurantProfileController.js';

import {
  restaurantRegisterSchema,
  restaurantLoginSchema,
  changePasswordSchema,
  editProfileSchema,
  addMenuSchema,
  changeAvailabilitySchema,
} from './restaurantProfileSchemas.js';

const router = express.Router();
const role = 'restaurant';

router.post('/register', validate(restaurantRegisterSchema), restaurant_signup);
router.post('/login', validate(restaurantLoginSchema), restaurant_login);
router.get('/logout', logout);
router.get('/is-verify', authorization, authorizeRoles(role), verify);

router.post(
  '/add_menu',
  authorization,
  authorizeRoles(role),
  upload.single('image'),
  validate(addMenuSchema),
  add_menu
);

router.put(
  '/edit_menu/:menu_item_id',
  authorization,
  authorizeRoles(role),
  upload.single('image'),
  edit_menu
);

router.put(
  '/change_availablity/:menu_item_id',
  authorization,
  authorizeRoles(role),
  validate(changeAvailabilitySchema),
  change_menu_availability
);

router.delete('/delete_menu/:menu_item_id', authorization, authorizeRoles(role), delete_menu);

router.put(
  '/change_password',
  authorization,
  authorizeRoles(role),
  validate(changePasswordSchema),
  changePassword
);

router.get('/get_menu_items', authorization, authorizeRoles(role), get_menu);
router.get('/get_menu_categories', authorization, authorizeRoles(role), get_menu_categories);

router.get('/get_restaurant_profile', authorization, authorizeRoles(role), getRestaurantProfile);

router.post(
  '/edit_profile',
  authorization,
  authorizeRoles(role),
  upload.single('image'),
  validate(editProfileSchema),
  editProfile
);

router.get('/reviews', authorization, authorizeRoles(role), getReviewsAll);

export { router };
