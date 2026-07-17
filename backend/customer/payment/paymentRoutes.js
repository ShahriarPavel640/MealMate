import express from "express";
import authorization from "../../middleware/authorization.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { handleIPN, initiatePayment, handleSuccess, handleFail, handleCancel } from "./paymentController.js";

export default (store_id, store_passwd) => {
  const router = express.Router();
  const role = "customer";

  router.post("/initiate", authorization, authorizeRoles(role), (req, res) => initiatePayment(req, res, store_id, store_passwd));
  router.post("/ipn", express.urlencoded({ extended: true }), (req, res) => handleIPN(req, res, store_id, store_passwd));
  
  router.post("/success", handleSuccess);
  router.post("/fail", handleFail);
  router.post("/cancel", handleCancel);

  return router;
};