import SSLCommerzPayment from "sslcommerz-lts";
import prisma from "../../prismaClient.js";
import { createOrderFromCart, fetchFullOrderDetails } from "../order/orderService.js";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../../middleware/errorHandler.js";
import logger from "../../utils/logger.js";

const is_live = process.env.SSL_COMMERZ_IS_LIVE === "true";

export const initiatePaymentService = async ({
  userId,
  cartItems,
  customerInfo,
  total_amount,
  paymentMethod = "sslcommerz",
  specialInstructions = {},
  store_id,
  store_passwd,
}) => {
  const tran_id = `TXN_${Date.now()}_${userId}_${uuidv4()}`;

  // Atomic order and payment record creation in Prisma transaction
  const { createdOrders, totalCalculatedAmount } = await prisma.$transaction(
    async (tx) => {
      const orders = await createOrderFromCart(
        userId,
        cartItems,
        tx,
        tran_id,
        "pending_payment",
        specialInstructions
      );

      let calcTotal = 0;
      for (const order of orders) {
        calcTotal += parseFloat(order.total_amount);
        await tx.payments.create({
          data: {
            order_id: order.order_id,
            user_id: parseInt(userId),
            method_type: paymentMethod,
            amount: order.total_amount,
            status: "pending",
            tran_id: tran_id,
          },
        });
      }

      return { createdOrders: orders, totalCalculatedAmount: calcTotal };
    }
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

  const addressString =
    typeof customerInfo.address === "object"
      ? `${customerInfo.address?.street || ""}, ${customerInfo.address?.city || ""}, ${customerInfo.address?.postal_code || ""}`
      : customerInfo.address || "N/A";

  const data = {
    total_amount: total_amount || totalCalculatedAmount,
    currency: "BDT",
    tran_id: tran_id,
    success_url: `${backendUrl}/api/customer/payment/success?tran_id=${tran_id}`,
    fail_url: `${backendUrl}/api/customer/payment/fail?tran_id=${tran_id}`,
    cancel_url: `${backendUrl}/api/customer/payment/cancel?tran_id=${tran_id}`,
    ipn_url: `${backendUrl}/api/customer/payment/ipn`,
    shipping_method: "Courier",
    product_name: "Food Order",
    product_category: "Food",
    product_profile: "general",
    cus_name: customerInfo.name,
    cus_email: customerInfo.email,
    cus_add1: addressString,
    cus_add2: "N/A",
    cus_city: "N/A",
    cus_state: "N/A",
    cus_postcode: "N/A",
    cus_country: "Bangladesh",
    cus_phone: customerInfo.phone,
    cus_fax: "N/A",
    ship_name: customerInfo.name,
    ship_add1: addressString,
    ship_add2: "N/A",
    ship_city: "N/A",
    ship_state: "N/A",
    ship_postcode: "N/A",
    ship_country: "Bangladesh",
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const apiResponse = await sslcz.init(data);

  if (apiResponse.status === "SUCCESS") {
    return {
      paymentUrl: apiResponse.GatewayPageURL,
      status: "success",
      tran_id,
    };
  } else {
    // Rollback by cancelling created orders
    await prisma.$transaction(async (tx) => {
      await tx.payments.updateMany({
        where: { tran_id },
        data: { status: "failed" },
      });
      await tx.orders.updateMany({
        where: { tran_id },
        data: { status: "cancelled" },
      });
    });
    logger.error("SSLCommerz initiation failed:", apiResponse);
    throw new AppError("Payment initiation failed", 400);
  }
};

export const handleSuccessService = async (tran_id) => {
  if (!tran_id) {
    throw new AppError("Transaction ID is missing", 400);
  }

  return await prisma.$transaction(async (tx) => {
    await tx.payments.updateMany({
      where: { tran_id },
      data: { status: "completed" },
    });

    await tx.orders.updateMany({
      where: { tran_id },
      data: { status: "pending_restaurant_acceptance" },
    });

    const orders = await tx.orders.findMany({
      where: { tran_id },
    });

    if (orders.length > 0) {
      // Clear user active cart
      await tx.carts.updateMany({
        where: { user_id: orders[0].user_id, status: "active" },
        data: { status: "completed" },
      });

      for (const order of orders) {
        await tx.notifications.create({
          data: {
            user_id: order.user_id,
            target_type: "restaurant",
            target_id: order.restaurant_id,
            order_id: order.order_id,
            type: "order_update",
            message: `You have a new order (#${order.order_id}) from a customer (Paid via SSLCommerz).`,
          },
        });
      }
    }

    // Fetch full order details for socket emissions
    const fullOrders = [];
    for (const order of orders) {
      const fullOrder = await fetchFullOrderDetails(order.order_id, tx);
      if (fullOrder) {
        fullOrders.push(fullOrder);
      }
    }

    return { tran_id, orders, fullOrders };
  });
};

export const handleFailService = async (tran_id) => {
  if (tran_id) {
    await prisma.$transaction(async (tx) => {
      await tx.payments.updateMany({
        where: { tran_id },
        data: { status: "failed" },
      });
      await tx.orders.updateMany({
        where: { tran_id },
        data: { status: "cancelled" },
      });
    });
  }
  return { tran_id };
};

export const handleCancelService = async (tran_id) => {
  if (tran_id) {
    await prisma.$transaction(async (tx) => {
      await tx.payments.updateMany({
        where: { tran_id },
        data: { status: "cancelled" },
      });
      await tx.orders.updateMany({
        where: { tran_id },
        data: { status: "cancelled" },
      });
    });
  }
  return { tran_id };
};

export const handleIPNService = async (body, store_id, store_passwd) => {
  logger.info("Received SSLCommerz IPN", { body });
  return { message: "IPN received (placeholder)" };
};
