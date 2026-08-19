import express from "express";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { validate } from "../../middleware/validate.js";
import {
  getOrders,
  getRecentOrders,
  todaysOrderStat,
  updateStatus,
} from "./orderController.js";
import { updateOrderStatusSchema } from "./orderSchemas.js";

const router = express.Router();
const role = "restaurant";

router.get(
  "/recent_orders",
  authorization,
  authorizeRoles(role),
  getRecentOrders
);

router.get(
  "/all_orders",
  authorization,
  authorizeRoles(role),
  getOrders
);

router.get(
  "/orders",
  authorization,
  authorizeRoles(role),
  getOrders
);

router.put(
  "/update_order_status",
  authorization,
  authorizeRoles(role),
  validate(updateOrderStatusSchema),
  updateStatus
);

router.put(
  "/orders/:orderId/status",
  authorization,
  authorizeRoles(role),
  validate(updateOrderStatusSchema),
  updateStatus
);

router.get(
  "/today_stat",
  authorization,
  authorizeRoles(role),
  todaysOrderStat
);

export default router;
