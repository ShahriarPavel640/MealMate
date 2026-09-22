import express from 'express';
import * as orderController from './orderController.js';
import authorization from '@/middleware/authorization.js';
import authorizeRoles from '@/middleware/authorizeRoles.js';
import { validate } from '@/middleware/validate.js';
import { createOrderSchema } from './orderSchemas.js';

const router = express.Router();
const role = 'customer';

router.post(
  '/create',
  authorization,
  authorizeRoles(role),
  validate(createOrderSchema),
  orderController.createOrder
);
router.get('/', authorization, authorizeRoles(role), orderController.getOrders);
router.get('/:orderId', authorization, authorizeRoles(role), orderController.getOrderById);
router.get(
  '/:orderId/location',
  authorization,
  authorizeRoles(role),
  orderController.getRealTimeLocation
);

export default router;
