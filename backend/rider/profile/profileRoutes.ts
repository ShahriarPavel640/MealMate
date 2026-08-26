import express from 'express';
import authorization from '../../middleware/authorization.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, updateAvailabilitySchema } from './profileSchemas.js';

import {
  getRiderProfile,
  updateRiderProfile,
  updateRiderAvailability,
} from './profileController.js';

const router = express.Router();
const role = 'rider';

router.get('/', authorization, authorizeRoles(role), getRiderProfile);

router.put(
  '/',
  authorization,
  authorizeRoles(role),
  validate(updateProfileSchema),
  updateRiderProfile
);

router.put(
  '/availability',
  authorization,
  authorizeRoles(role),
  validate(updateAvailabilitySchema),
  updateRiderAvailability
);

export default router;
