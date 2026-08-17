import pool from "../../db.js";

export const getOrCreateActiveCart = async (userId) => {
  let result = await pool.query(
    "SELECT * FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1",
    [userId]
  );

  if (result.rows.length === 0) {
    result = await pool.query(
      "INSERT INTO carts (user_id, status) VALUES ($1, 'active') RETURNING *",
      [userId]
    );
  }

  return result.rows[0];
};

export const addItemToCart = async (req, res) => {
  const userId = req.user.id;
  const { menu_id, restaurant_id, quantity } = req.body;

  if (!menu_id || !restaurant_id || !quantity) {
    return res
      .status(400)
      .json({ message: "Missing menu_id, restaurant_id, or quantity." });
  }

  try {
    const cart = await getOrCreateActiveCart(userId);

    // Check if item already exists
    const existing = await pool.query(
      `SELECT * FROM cart_item WHERE cart_id = $1 AND menu_item_id = $2 AND restaurant_id = $3`,
      [cart.cart_id, menu_id, restaurant_id]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      await pool.query(
        `UPDATE cart_item SET quantity = quantity + $1 WHERE cart_item_id = $2`,
        [quantity, existing.rows[0].cart_item_id]
      );
    } else {
      // Insert new item
      await pool.query(
        `INSERT INTO cart_item (cart_id, menu_item_id, restaurant_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [cart.cart_id, menu_id, restaurant_id, quantity]
      );
    }

    res.status(200).json({ message: "Item added to cart successfully." });
  } catch (err) {
    console.error("Error in addItemToCart:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCartItem = async (req, res) => {
  const { cart_item_id } = req.params;
    const userId = req.user.id;

  try {
    await pool.query("DELETE FROM cart_item USING carts WHERE cart_item.cart_id = carts.cart_id AND carts.user_id = $2 AND cart_item.cart_item_id = $1", [cart_item_id, userId]);
    res.status(200).json({ message: "Item deleted from cart." });
  } catch (err) {
    console.error("Error in deleteCartItem:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT cart_id FROM carts WHERE user_id = $1 AND status = 'active'",
      [userId]
    );

    if (result.rows.length > 0) {
      const cartId = result.rows[0].cart_id;
      await pool.query("DELETE FROM cart_item WHERE cart_id = $1", [cartId]);
    }

    res.status(200).json({ message: "Cart cleared." });
  } catch (err) {
    console.error("Error in clearCart:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT ci.quantity, c.cart_id, ci.cart_item_id, mi.menu_item_id, mi.name, mi.price, mi.menu_item_image_url as image
      FROM carts c
      JOIN cart_item ci ON c.cart_id = ci.cart_id
      JOIN menu_items mi ON ci.MENU_ITEM_ID = mi.MENU_ITEM_ID
      WHERE c.user_id = $1 AND c.status = 'active'
      `,
      [userId]
    );
    console.log(result.rows);

    res.status(200).json({ cart: result.rows });
  } catch (err) {
    console.error("Error in getCart:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { menu_item_id, restaurant_id, quantity } = req.body;

  if (!menu_item_id || !restaurant_id || !quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    let cartResult = await pool.query(
      "SELECT * FROM carts WHERE user_id = $1 AND status = 'active'",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      cartResult = await pool.query(
        "INSERT INTO carts (user_id, status) VALUES ($1, 'active') RETURNING *",
        [userId]
      );
    }

    const cartId = cartResult.rows[0].cart_id;

    const checkPrev = await pool.query(
      `SELECT * FROM cart_item 
       WHERE menu_item_id = $1 AND cart_id = $2`,
      [menu_item_id, cartId]
    );

    if (checkPrev.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO cart_item (cart_id, menu_item_id, restaurant_id, quantity) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [cartId, menu_item_id, restaurant_id, quantity]
      );
      return res
        .status(201)
        .json({ message: "Item added to cart", item: insertResult.rows[0] });
    } else {
      const updateResult = await pool.query(
        `UPDATE cart_item 
         SET quantity = $1 
         WHERE menu_item_id = $2 AND cart_id = $3 
         RETURNING *`,
        [quantity, menu_item_id, cartId]
      );
      return res
        .status(200)
        .json({ message: "Item quantity updated", item: updateResult.rows[0] });
    }
  } catch (err) {
    console.error("Error in addToCart:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
