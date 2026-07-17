import express from "express";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import {
  getOrders,
  getRecentOrders,
  todaysOrderStat,
  updateStatus,
} from "./orderController.js";

const restaurantOrder = express.Router();
const role = "restaurant";

restaurantOrder.get(
  "/recent_orders",
  authorization,
  authorizeRoles(role),
  getRecentOrders
);

restaurantOrder.get(
  "/all_orders",
  authorization,
  authorizeRoles(role),
  getOrders
);

restaurantOrder.put(
  "/update_order_status",
  authorization,
  authorizeRoles(role),
  updateStatus
);
restaurantOrder.get(
  "/today_stat",
  authorization,
  authorizeRoles(role),
  todaysOrderStat
);

export default restaurantOrder;
