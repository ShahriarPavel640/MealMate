import express from "express";
import { validate } from "../../middleware/validate.js";
import { signupSchema, loginSchema, changePasswordSchema, updateProfileSchema } from "../../schemas/auth.js";
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

router.post("/register", validate(signupSchema), customer_signup);
router.post("/login", customer_login);
router.get("/logout", logout);
router.get("/is-verify", authorization, authorizeRoles(role), verifyUser);
router.put("/change_password", authorization, authorizeRoles(role), validate(changePasswordSchema), changePassword);
router.get("/profile", authorization, authorizeRoles(role), getProfile);
router.put("/update_profile", authorization, authorizeRoles(role), validate(updateProfileSchema), updateProfile);

export default router;

