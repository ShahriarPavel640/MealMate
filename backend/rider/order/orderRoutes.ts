import express from 'express';
import authorization from '@/middleware/authorization.js';
import authorizeRoles from '@/middleware/authorizeRoles.js';
import { validate } from '@/middleware/validate.js';
import { updateOrderStatusSchema } from './orderSchemas.js';

import {
  getDeliveryHistory,
  acceptOrder,
  updateOrderStatus,
  getOrderDetails,
} from './orderController.js';

const router = express.Router();
const role = 'rider';

router.get('/history', authorization, authorizeRoles(role), getDeliveryHistory);

router.put('/:orderId/accept', authorization, authorizeRoles(role), acceptOrder);

router.put(
  '/:orderId/status',
  authorization,
  authorizeRoles(role),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

router.get('/:orderId', authorization, authorizeRoles(role), getOrderDetails);

export default router;
