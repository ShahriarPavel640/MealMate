import express from "express";
import validinfo from "../../middleware/validinfo.js";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/athorizeRoles.js";

import {
  signup as rider_signup,
  login as rider_login,
  logout,
  verify,
} from "./riderAuthController.js";

const router = express.Router();

router.post("/signup", validinfo, rider_signup);
router.post("/login", validinfo, rider_login);
router.post("/logout", logout);

const role = "rider";

router.get(
  "/is-verify",
  authorization,
  authorizeRoles(role),
  verify
);

export default router;
