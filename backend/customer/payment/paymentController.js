import * as paymentService from "./paymentService.js";
import { getIO } from "../../socket.js";
import logger from "../../utils/logger.js";

export const initiatePayment = async (req, res, next, store_id, store_passwd) => {
  try {
    const { cartItems, customerInfo, total_amount, paymentMethod, specialInstructions } = req.body;
    const userId = req.user.id;

    const result = await paymentService.initiatePaymentService({
      userId,
      cartItems,
      customerInfo,
      total_amount,
      paymentMethod,
      specialInstructions,
      store_id,
      store_passwd,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handleSuccess = async (req, res, next) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  try {
    const { orders, fullOrders } = await paymentService.handleSuccessService(tran_id);

    // Socket.IO emission to restaurants
    if (fullOrders && fullOrders.length > 0) {
      const io = getIO();
      for (const fullOrder of fullOrders) {
        if (fullOrder.restaurant_id) {
          io.to(`restaurant_${fullOrder.restaurant_id}`).emit("new_order", fullOrder);
        }
      }
    }

    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success?tran_id=${tran_id}`;
    res.redirect(redirectUrl);
  } catch (err) {
    logger.error("Error handling payment success redirect:", err);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-fail?tran_id=${tran_id}`);
  }
};

export const handleFail = async (req, res, next) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  try {
    await paymentService.handleFailService(tran_id);
  } catch (err) {
    logger.error("Error handling payment fail redirect:", err);
  } finally {
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-fail?tran_id=${tran_id}`);
  }
};

export const handleCancel = async (req, res, next) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  try {
    await paymentService.handleCancelService(tran_id);
  } catch (err) {
    logger.error("Error handling payment cancel redirect:", err);
  } finally {
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-cancel?tran_id=${tran_id}`);
  }
};

export const handleIPN = async (req, res, next, store_id, store_passwd) => {
  try {
    const result = await paymentService.handleIPNService(req.body, store_id, store_passwd);
    res.status(200).send(result.message || "IPN received (placeholder)");
  } catch (err) {
    next(err);
  }
};
