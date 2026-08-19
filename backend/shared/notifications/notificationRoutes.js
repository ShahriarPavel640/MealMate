import express from "express";
import { getNotifications, markAsRead } from "./notificationController.js";
import authorization from "../../middleware/authorization.js";

const router = express.Router();

router.get("/", authorization, getNotifications);
router.put("/mark-read", authorization, markAsRead);

export default router;
