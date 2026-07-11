import express from "express";
import validinfo from "../../middleware/validinfo.js";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/athorizeRoles.js";
import {
  getDashboardData,
  getRiderProfile,
  updateRiderProfile,
  updateRiderAvailability,
  getDeliveryHistory,
  acceptOrder,
  updateOrderStatus,
  getOrderDetails,
  getEarnings,
} from "./riderController.js";

const router = express.Router();
const role = "rider";

router.get(
  "/dashboard",
  authorization,
  authorizeRoles(role),
  getDashboardData
);

router.get(
  "/profile",
  authorization,
  authorizeRoles(role),
  getRiderProfile
);

router.put(
  "/profile",
  authorization,
  authorizeRoles(role),
  updateRiderProfile
);

router.put(
  "/availability",
  authorization,
  authorizeRoles(role),
  updateRiderAvailability
);

router.get(
  "/history",
  authorization,
  authorizeRoles(role),
  getDeliveryHistory
);

router.get("/earnings", authorization, authorizeRoles(role), getEarnings);

router.put(
  "/orders/:orderId/accept",
  authorization,
  authorizeRoles(role),
  acceptOrder
);

router.put(
  "/orders/:orderId/status",
  authorization,
  authorizeRoles(role),
  updateOrderStatus
);

router.get(
  "/orders/:orderId",
  authorization,
  authorizeRoles(role),
  getOrderDetails
);

export default router;
