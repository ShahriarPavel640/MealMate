import express from "express";
import { validate } from "../../middleware/validate.js";
import { riderAuthSchema } from "../../schemas/extra.js";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";

import {
  signup as rider_signup,
  login as rider_login,
  logout,
  verify,
} from "./riderAuthController.js";

const router = express.Router();

router.post("/signup", validate(riderAuthSchema), rider_signup);
router.post("/login", rider_login);
router.post("/logout", logout);

const role = "rider";

router.get(
  "/is-verify",
  authorization,
  authorizeRoles(role),
  verify
);

export default router;

