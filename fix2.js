const fs = require('fs');
let text = fs.readFileSync('backend/customer/payment/paymentController.js', 'utf8');

const startIdx = text.indexOf('export const initiatePayment = async (req, res, store_id, store_passwd) => {');
const endIdx = text.indexOf('export const handleIPN = async (req, res, store_id, store_passwd) => {');

const correctInitiatePayment = `export const initiatePayment = async (req, res, store_id, store_passwd) => {
  const { cartItems, customerInfo, paymentMethod, specialInstructions } = req.body;

  const client = await pool.connect();
  const userId = req.user.id;
  const tran_id = \`TXN_\${Date.now()}_\${userId}_\${uuidv4()}\`;

  try {
    await client.query("BEGIN");

    let total_amount = 0;
    for (let item of cartItems) {
      const itemQuery = await client.query("SELECT price FROM menu_items WHERE menu_item_id = $1", [item.menu_item_id]);
      if (itemQuery.rows.length === 0) throw new Error("Menu item not found");
      const price = itemQuery.rows[0].price;
      item.price = price;
      total_amount += price * item.quantity;
    }

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

    const data = {
      total_amount: total_amount,
      currency: "BDT",
      tran_id: tran_id,
      success_url: \`\${process.env.BACKEND_URL}/api/customer/payment/success?tran_id=\${tran_id}\`,
      fail_url: \`\${process.env.BACKEND_URL}/api/customer/payment/fail?tran_id=\${tran_id}\`,
      cancel_url: \`\${process.env.BACKEND_URL}/api/customer/payment/cancel?tran_id=\${tran_id}\`,
      ipn_url: \`\${process.env.BACKEND_URL}/api/customer/payment/ipn\`,
      shipping_method: "Courier",
      product_name: "Food Order",
      product_category: "Food",
      product_profile: "general",
      cus_name: customerInfo.name,
      cus_email: customerInfo.email,
      cus_add1: customerInfo.address?.street || customerInfo.address,
      cus_add2: "Dhaka",
      cus_city: customerInfo.address?.city || "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: customerInfo.address?.postal_code || "1000",
      cus_country: "Bangladesh",
      cus_phone: customerInfo.phone,
      cus_fax: "01711111111",
      ship_name: customerInfo.name,
      ship_add1: "Dhaka",
      ship_add2: "Dhaka",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: 1000,
      ship_country: "Bangladesh",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    sslcz.init(data).then(async (apiResponse) => {
      let GatewayPageURL = apiResponse.GatewayPageURL;
      res.send({ paymentUrl: GatewayPageURL });
    });

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment error:", error);
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

`;

text = text.substring(0, startIdx) + correctInitiatePayment + text.substring(endIdx);
fs.writeFileSync('backend/customer/payment/paymentController.js', text);
console.log("Replaced successfully");
