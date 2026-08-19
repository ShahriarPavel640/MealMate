import express from "express";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { validate } from "../../middleware/validate.js";
import {
  updateProfileSchema,
  updateAvailabilitySchema,
  updateOrderStatusSchema
} from "./riderSchemas.js";

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
  getRiderReviews,
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
  validate(updateProfileSchema),
  updateRiderProfile
);

router.put(
  "/availability",
  authorization,
  authorizeRoles(role),
  validate(updateAvailabilitySchema),
  updateRiderAvailability
);

router.get(
  "/history",
  authorization,
  authorizeRoles(role),
  getDeliveryHistory
);

router.get("/earnings", authorization, authorizeRoles(role), getEarnings);

router.get("/reviews", authorization, authorizeRoles(role), getRiderReviews);

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
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

router.get(
  "/orders/:orderId",
  authorization,
  authorizeRoles(role),
  getOrderDetails
);

export default router;
