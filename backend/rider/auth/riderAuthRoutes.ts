import express from 'express';
import authorization from '@/middleware/authorization.js';
import authorizeRoles from '@/middleware/authorizeRoles.js';
import { validate } from '@/middleware/validate.js';
import { riderSignupSchema, riderLoginSchema } from './riderAuthSchemas.js';

import {
  signup as rider_signup,
  login as rider_login,
  logout,
  verify,
} from './riderAuthController.js';

const router = express.Router();
const role = 'rider';

router.post('/signup', validate(riderSignupSchema), rider_signup);
router.post('/login', validate(riderLoginSchema), rider_login);
router.post('/logout', logout);

router.get('/is-verify', authorization, authorizeRoles(role), verify);

export default router;
