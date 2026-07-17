import express from "express";
import validinfo from "../../middleware/validinfo.js";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";

import {
  changePassword,
  login as customer_login,
  signup as customer_signup,
  getProfile,
  logout,
  updateProfile,
  verifyUser,
} from "./authController.js";

const router = express.Router();
const role = "customer";

router.post("/register", validinfo, customer_signup);
router.post("/login", validinfo, customer_login);
router.get("/logout", logout);
router.get("/is-verify", authorization, authorizeRoles(role), verifyUser);
router.put(
  "/change_password",
  authorization,
  authorizeRoles(role),
  changePassword
);
router.get("/profile", authorization, authorizeRoles(role), getProfile);
router.put(
  "/update_profile",
  authorization,
  authorizeRoles(role),
  updateProfile
);

export default router;
