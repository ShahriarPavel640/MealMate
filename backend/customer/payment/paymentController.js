// import SSLCommerzPayment from "sslcommerz-lts";
import SSLCommerzPayment from "sslcommerz-lts";
import pool from "../../db.js";
import { createOrderFromCart } from "../order/orderController.js";
import { v4 as uuidv4 } from "uuid";

const is_live = process.env.SSL_COMMERZ_IS_LIVE === "true";

export const initiatePayment = async (req, res, store_id, store_passwd) => {
  const { cartItems, customerInfo, total_amount, paymentMethod, specialInstructions } = req.body;

  console.log(req.body);
  const userId = req.user.id;
  // const tran_id = `TXN_${Date.now()}_${userId}`;
  const tran_id = `TXN_${Date.now()}_${userId}_${uuidv4()}`;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create the order with a 'pending_payment' status
    const createdOrders = await createOrderFromCart(
      userId,
      cartItems,
      client,
      tran_id,
      "pending_payment",
      specialInstructions
    );

    // 2. Create a corresponding payment record
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
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";

    console.log("DEBUG: process.env.FRONTEND_URL =", process.env.FRONTEND_URL);
    console.log("DEBUG: frontendUrl (resolved) =", frontendUrl);

    // Flatten address object to string
    const addressString = `${customerInfo.address.street}, ${customerInfo.address.city}, ${customerInfo.address.postal_code}`;

    const data = {
      total_amount: total_amount,
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

    console.log("DEBUG: success_url sent to SSLCommerz =", data.success_url);

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

// export const initiatePayment = async (req, res, store_id, store_passwd) => {
//   const { cartItems, customerInfo, total_amount, paymentMethod } = req.body; // Added paymentMethod
//   const userId = req.user.id;
//   const tran_id = `TXN_${Date.now()}_${userId}`;

//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     // 1. Create the order with a 'pending_payment' status
//     const createdOrders = await createOrderFromCart(
//       userId,
//       cartItems,
//       client,
//       tran_id,
//       "pending_payment"
//     );

//     // 2. Create a corresponding payment record
//     for (const order of createdOrders) {
//       await client.query(
//         "INSERT INTO payments (order_id, user_id, method_type, amount, status, tran_id) VALUES ($1, $2, $3, $4, $5, $6)",
//         [
//           order.order_id,
//           userId,
//           paymentMethod,
//           order.total_amount,
//           "pending",
//           tran_id,
//         ] // Used paymentMethod here
//       );
//     }

//     const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
//     const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";

//     console.log("DEBUG: process.env.FRONTEND_URL =", process.env.FRONTEND_URL);
//     console.log("DEBUG: frontendUrl (resolved) =", frontendUrl);

//     const data = {
//       total_amount: total_amount,
//       currency: "BDT",
//       tran_id: tran_id, // use unique tran_id for each api call
//       success_url: `${backendUrl}/api/customer/payment/success?tran_id=${tran_id}`,
//       fail_url: `${backendUrl}/api/customer/payment/fail?tran_id=${tran_id}`,
//       cancel_url: `${backendUrl}/api/customer/payment/cancel?tran_id=${tran_id}`,
//       ipn_url: `${backendUrl}/api/customer/payment/ipn`,
//       shipping_method: "Courier",
//       product_name: "Food Order",
//       product_category: "Food",
//       product_profile: "general",
//       cus_name: customerInfo.name,
//       cus_email: customerInfo.email,
//       cus_add1: customerInfo.address,
//       cus_add2: "N/A",
//       cus_city: "N/A",
//       cus_state: "N/A",
//       cus_postcode: "N/A",
//       cus_country: "Bangladesh",
//       cus_phone: customerInfo.phone,
//       cus_fax: "N/A",
//       ship_name: customerInfo.name,
//       ship_add1: customerInfo.address,
//       ship_add2: "N/A",
//       ship_city: "N/A",
//       ship_state: "N/A",
//       ship_postcode: "N/A",
//       ship_country: "Bangladesh",
//     };

//     console.log("DEBUG: success_url sent to SSLCommerz =", data.success_url);

//     const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

//     sslcz
//       .init(data)
//       .then(async (apiResponse) => {
//         if (apiResponse.status === "SUCCESS") {
//           await client.query("COMMIT");
//           res.status(200).json({
//             paymentUrl: apiResponse.GatewayPageURL,
//             status: "success",
//           });
//         } else {
//           await client.query("ROLLBACK");
//           console.error("SSLCommerz initiation failed:", apiResponse);
//           res.status(400).json({
//             message: "Payment initiation failed",
//             details: apiResponse,
//             status: "failed",
//           });
//         }
//       })
//       .catch(async (err) => {
//         await client.query("ROLLBACK");
//         console.error("Error initiating SSLCommerz payment:", err.message);
//         res.status(500).json({
//           message: "Internal server error",
//           error: err.message,
//         });
//       });

//     // const apiResponse = await sslcz.init(data);

//     // if (apiResponse.status === "SUCCESS") {
//     //   await client.query("COMMIT");
//     //   res.status(200).json({
//     //     paymentUrl: apiResponse.GatewayPageURL,
//     //     status: "success",
//     //   });
//     // } else {
//     //   await client.query("ROLLBACK");
//     //   console.error("SSLCommerz initiation failed:", apiResponse);
//     //   res.status(400).json({
//     //     message: "Payment initiation failed",
//     //     details: apiResponse,
//     //     status: "failed",
//     //   });
//     // }
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Error initiating SSLCommerz payment:", error.message);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   } finally {
//     client.release();
//   }
// };

// --- CLEANED: TESTING-ONLY REDIRECT HANDLERS (ONE DEFINITION EACH) ---

export const handleSuccess = async (req, res) => {
  const { tran_id } = req.query;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE payments SET status = $1 WHERE tran_id = $2", [
      "completed",
      tran_id,
    ]);
    await client.query("UPDATE orders SET status = $1 WHERE tran_id = $2", [
      "pending_restaurant_acceptance",
      tran_id,
    ]);
    await client.query("COMMIT");
    const redirectUrl = `${process.env.FRONTEND_URL}/payment-success?tran_id=${tran_id}`;
    console.log("DEBUG: Redirecting to:", redirectUrl);
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
  const { tran_id } = req.query;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
  const { tran_id } = req.query;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
  // This IPN handler is currently a placeholder for testing purposes.
  // In a production environment, this function would contain robust validation
  // and database update logic, as it is the most secure way to confirm payments.
  console.log("Received IPN (placeholder):", req.body);
  res.status(200).send("IPN received (placeholder)");
};
