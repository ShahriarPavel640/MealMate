import express from 'express';
import authorization from '../../middleware/authorization.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';

import { getDashboardData, getEarnings, getRiderReviews } from './statsController.js';

const router = express.Router();
const role = 'rider';

router.get('/dashboard', authorization, authorizeRoles(role), getDashboardData);

router.get('/earnings', authorization, authorizeRoles(role), getEarnings);

router.get('/reviews', authorization, authorizeRoles(role), getRiderReviews);

export default router;
