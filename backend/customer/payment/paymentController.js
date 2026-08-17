import SSLCommerzPayment from "sslcommerz-lts";
import pool from "../../db.js";
import { createOrderFromCart } from "../order/orderController.js";
import { v4 as uuidv4 } from "uuid";
import { getIO } from "../../socket.js";

const is_live = process.env.SSL_COMMERZ_IS_LIVE === "true";

export const initiatePayment = async (req, res, store_id, store_passwd) => {
  const { cartItems, customerInfo, total_amount, paymentMethod, specialInstructions } = req.body;

  const userId = req.user.id;
  const tran_id = `TXN_${Date.now()}_${userId}_${uuidv4()}`;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const createdOrders = await createOrderFromCart(
      userId,
      cartItems,
      client,
      tran_id,
      "pending_payment",
      specialInstructions
    );
    for (const order of createdOrders) {
      await client.query(
        "INSERT INTO payments (order_id, user_id, method_type, amount, status, tran_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          order.order_id,
          userId,
          paymentMethod,
          order.total_amount,
          "pending",
          tran_id,
        ]
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const addressString = `${customerInfo.address.street}, ${customerInfo.address.city}, ${customerInfo.address.postal_code}`;

    const final_total_amount = createdOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const data = {
        total_amount: final_total_amount,
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
      await client.query("COMMIT");
      res.status(200).json({
        paymentUrl: apiResponse.GatewayPageURL,
        status: "success",
      });
    } else {
      await client.query("ROLLBACK");
      console.error("SSLCommerz initiation failed:", apiResponse);
      res.status(400).json({
        message: "Payment initiation failed",
        details: apiResponse,
        status: "failed",
      });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error initiating SSLCommerz payment:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  } finally {
    client.release();
  }
};

export const handleSuccess = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const check = await client.query("SELECT * FROM payments WHERE tran_id = $1", [tran_id]);
    if (check.rows.length === 0) { await client.query("ROLLBACK"); return res.status(400).json("Invalid transaction"); }
    await client.query("UPDATE payments SET status = $1 WHERE tran_id = $2", [
      "completed",
      tran_id,
    ]);
    const orderResult = await client.query("UPDATE orders SET status = $1 WHERE tran_id = $2 RETURNING order_id, restaurant_id, user_id", [
      "pending_restaurant_acceptance",
      tran_id,
    ]);
    if (orderResult.rows.length > 0) {
       await client.query(
        "UPDATE carts SET status = 'completed' WHERE user_id = $1 AND status = 'active'",
        [orderResult.rows[0].user_id]
      );
    }
    await client.query("COMMIT");

    if (orderResult.rows.length > 0) {
      const orderInfo = orderResult.rows[0];
      const fullOrderResult = await client.query(
        `SELECT
          o.order_id,
          o.user_id AS customer_id,
          u.name AS customer_name,
          u.phone_number AS customer_phone,
          o.total_amount,
          o.status,
          p.method_type AS payment_method,
          d.dropoff_addr,
          o.created_at,
          o.rider_id,
          r.name AS rider_name,
          r.phone_number AS rider_phone,
          JSON_AGG(
            json_build_object(
            'order_id', oi.order_id,
            'quantity', oi.quantity,
            'menu_item_id', mi.menu_item_id,
            'name', mi.name,
            'price', mi.price,
            'menu_item_image_url',mi.menu_item_image_url
            )
          ) AS items
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN users r ON o.rider_id = r.user_id
        LEFT JOIN deliveries d ON o.order_id = d.order_id
        LEFT JOIN payments p ON o.order_id = p.order_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
        WHERE o.order_id = $1
        GROUP BY o.order_id, u.name, u.phone_number, r.name, r.phone_number, d.dropoff_addr, p.method_type`,
        [orderInfo.order_id]
      );

      const fullOrder = fullOrderResult.rows[0];

      if (fullOrder) {
        const io = getIO();
        io.to(`restaurant_${orderInfo.restaurant_id}`).emit("new_order", fullOrder);
        await client.query(
          "INSERT INTO notifications (user_id, target_type, target_id, order_id, type, message) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            orderInfo.user_id,
            "restaurant",
            orderInfo.restaurant_id,
            orderInfo.order_id,
            "order_update",
            `You have a new order (#${orderInfo.order_id}) from a customer (Paid via SSLCommerz).`,
          ]
        );
      }
    }

    const redirectUrl = `${process.env.FRONTEND_URL}/payment-success?tran_id=${tran_id}`;
        res.redirect(redirectUrl);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Error handling success redirect:",
      error.message,
      error.stack
    );
    res.redirect(`${process.env.FRONTEND_URL}/payment-fail?tran_id=${tran_id}`);
  } finally {
    client.release();
  }
};

export const handleFail = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const check = await client.query("SELECT * FROM payments WHERE tran_id = $1", [tran_id]);
    if (check.rows.length === 0) { await client.query("ROLLBACK"); return res.status(400).json("Invalid transaction"); }
    await client.query("UPDATE payments SET status = $1 WHERE tran_id = $2", [
      "failed",
      tran_id,
    ]);
    await client.query("UPDATE orders SET status = $1 WHERE tran_id = $2", [
      "cancelled",
      tran_id,
    ]);
    await client.query("COMMIT");
    res.redirect(`${process.env.FRONTEND_URL}/payment-fail?tran_id=${tran_id}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error handling fail redirect:", error.message, error.stack);
    res.redirect(`${process.env.FRONTEND_URL}/payment-fail?tran_id=${tran_id}`);
  } finally {
    client.release();
  }
};

export const handleCancel = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const check = await client.query("SELECT * FROM payments WHERE tran_id = $1", [tran_id]);
    if (check.rows.length === 0) { await client.query("ROLLBACK"); return res.status(400).json("Invalid transaction"); }
    await client.query("UPDATE payments SET status = $1 WHERE tran_id = $2", [
      "cancelled",
      tran_id,
    ]);
    await client.query("UPDATE orders SET status = $1 WHERE tran_id = $2", [
      "cancelled",
      tran_id,
    ]);
    await client.query("COMMIT");
    res.redirect(
      `${process.env.FRONTEND_URL}/payment-cancel?tran_id=${tran_id}`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Error handling cancel redirect:",
      error.message,
      error.stack
    );
    res.redirect(
      `${process.env.FRONTEND_URL}/payment-cancel?tran_id=${tran_id}`
    );
  } finally {
    client.release();
  }
};

export const handleIPN = async (req, res, store_id, store_passwd) => {
  console.log("Received IPN (placeholder):", req.body);
  res.status(200).send("IPN received (placeholder)");
};




