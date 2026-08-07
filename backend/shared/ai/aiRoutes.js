import express from "express";
import { generateMenuDescription, summarizeReviews } from "./aiController.js";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";

const router = express.Router();

// Restaurant authenticated endpoint
router.post("/generate-description", authorization, authorizeRoles("restaurant"), generateMenuDescription);

// Customer (public or authenticated) endpoint for reviews
router.get("/summarize-reviews/:restaurantId", summarizeReviews);

export default router;
