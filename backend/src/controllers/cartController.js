const pool = require("../config/db");

/* =========================================
   CREATE CART
   Body: { items: [{ productId, variantId, quantity }] }
   - productId = menu_items.id
   - variantId = product_sizes.id (the selected size)
   Prices always come from the database, never the browser.
========================================= */

const createCart = async (req, res, next) => {
  let connection;

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one item.",
      });
    }

    /* =====================================
       VALIDATE ITEMS
    ===================================== */

    const normalizedItems = [];

    for (const item of items) {
      // menuItemId is still accepted as an alias for productId
      const productId = Number(item.productId ?? item.menuItemId);
      const variantId = Number(item.variantId);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(variantId) ||
        variantId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart item.",
        });
      }

      normalizedItems.push({ productId, variantId, quantity });
    }

    /* =====================================
       GET CONNECTION
    ===================================== */

    connection = await pool.getConnection();
    await connection.beginTransaction();

    /* =====================================
       GET REAL PRODUCT + SIZE PRICE FROM DB
    ===================================== */

    const preparedItems = [];
    let grandTotal = 0;

    for (const item of normalizedItems) {
      const [rows] = await connection.query(
        `
        SELECT m.id, m.name, s.size, s.price
        FROM menu_items m
        JOIN product_sizes s ON s.product_id = m.id
        WHERE m.id = ?
          AND s.id = ?
          AND m.is_active = 1
        LIMIT 1
        `,
        [item.productId, item.variantId]
      );

      if (rows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "One of the selected items or sizes is unavailable.",
        });
      }

      const row = rows[0];
      const unitAmount = Number(row.price);
      const itemTotal = unitAmount * item.quantity;

      grandTotal += itemTotal;

      preparedItems.push({
        menuItemId: row.id,
        name: row.name,
        portion: row.size, // saved into cart_items.portion_type
        quantity: item.quantity,
        unitAmount,
        totalAmount: itemTotal,
      });
    }

    /* =====================================
       CREATE CART
    ===================================== */

    const [cartResult] = await connection.query(
      `
      INSERT INTO carts (status, total_amount)
      VALUES ('active', ?)
      `,
      [grandTotal]
    );

    const cartId = cartResult.insertId;

    /* =====================================
       INSERT CART ITEMS
    ===================================== */

    for (const item of preparedItems) {
      await connection.query(
        `
        INSERT INTO cart_items
        (
          cart_id,
          menu_item_id,
          item_name,
          portion_type,
          quantity,
          unit_amount,
          total_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          cartId,
          item.menuItemId,
          item.name,
          item.portion,
          item.quantity,
          item.unitAmount,
          item.totalAmount,
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Cart saved successfully.",
      data: {
        cartId,
        totalAmount: grandTotal,
        items: preparedItems,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Cart rollback error:", rollbackError);
      }
    }

    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/* =========================================
   GET CART
========================================= */

const getCart = async (req, res, next) => {
  try {
    const cartId = Number(req.params.id);

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart id.",
      });
    }

    const [carts] = await pool.query(
      `
      SELECT id, status, total_amount, created_at, updated_at
      FROM carts
      WHERE id = ?
      LIMIT 1
      `,
      [cartId]
    );

    if (carts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const [items] = await pool.query(
      `
      SELECT
        id,
        menu_item_id,
        item_name,
        portion_type AS portion,
        quantity,
        unit_amount,
        total_amount
      FROM cart_items
      WHERE cart_id = ?
      ORDER BY id ASC
      `,
      [cartId]
    );

    return res.status(200).json({
      success: true,
      data: { ...carts[0], items },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCart, getCart };