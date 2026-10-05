const pool = require("../config/db");

/* =========================================
   SHARED SELECT (menu + category name)
========================================= */

const MENU_SELECT = `
  SELECT
    m.id,
    m.category_id,
    c.name AS category_name,
    m.name,
    m.portion_type,
    m.amount,
    m.created_at,
    m.updated_at
  FROM menu_items m
  LEFT JOIN categories c ON c.id = m.category_id
`;

/* =========================================
   FORMAT MENU ITEM
========================================= */

const formatMenuItem = (item) => ({
  id: item.id,
  category_id: item.category_id ?? null,
  category_name: item.category_name || null,
  name: item.name,
  portion: item.portion_type,
  amount: Number(item.amount),
  created_at: item.created_at || null,
  updated_at: item.updated_at || null,
});

/* =========================================
   VALIDATE MENU INPUT
========================================= */

const validateMenuInput = (categoryId, name, portion, amount) => {
  const numericCategoryId = Number(categoryId);
  const menuName = String(name || "").trim();
  const portionName = String(portion || "").trim();
  const numericAmount = Number(amount);

  if (!Number.isInteger(numericCategoryId) || numericCategoryId <= 0) {
    return { error: "Please select a category." };
  }

  if (!menuName) return { error: "Menu name is required." };
  if (!portionName) return { error: "Portion is required." };
  if (portionName.length > 50) return { error: "Portion name is too long." };

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { error: "Please enter a valid amount." };
  }

  return { numericCategoryId, menuName, portionName, numericAmount };
};

/* =========================================
   PUBLIC MENU  GET /api/menu
========================================= */

const getPublicMenu = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `${MENU_SELECT} WHERE m.is_active = 1 ORDER BY m.id DESC`
    );

    return res.status(200).json({ success: true, data: rows.map(formatMenuItem) });
  } catch (error) {
    console.error("GET PUBLIC MENU ERROR:", error);
    next(error);
  }
};

/* =========================================
   ADMIN MENU  GET /api/menu/admin
========================================= */

const getAdminMenu = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `${MENU_SELECT} WHERE m.is_active = 1 ORDER BY m.id DESC`
    );

    return res.status(200).json({ success: true, data: rows.map(formatMenuItem) });
  } catch (error) {
    console.error("GET ADMIN MENU ERROR:", error);
    next(error);
  }
};

/* =========================================
   GET PORTIONS  GET /api/menu/portions
========================================= */

const getPortions = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT portion_type
      FROM menu_items
      WHERE
        is_active = 1
        AND portion_type IS NOT NULL
        AND TRIM(portion_type) <> ''
      ORDER BY portion_type ASC
    `);

    const savedPortions = rows.map((row) => row.portion_type);
    const defaultPortions = ["Single", "Double", "Full"];
    const portions = [...new Set([...defaultPortions, ...savedPortions])];

    return res.status(200).json({ success: true, data: portions });
  } catch (error) {
    console.error("GET PORTIONS ERROR:", error);
    next(error);
  }
};

/* =========================================
   CREATE MENU  POST /api/menu
========================================= */

const createMenu = async (req, res, next) => {
  try {
    const { category_id, name, portion, amount } = req.body;

    const validation = validateMenuInput(category_id, name, portion, amount);

    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const { numericCategoryId, menuName, portionName, numericAmount } = validation;

    const [result] = await pool.query(
      `
        INSERT INTO menu_items (category_id, name, portion_type, amount, is_active)
        VALUES (?, ?, ?, ?, 1)
      `,
      [numericCategoryId, menuName, portionName, numericAmount]
    );

    const [rows] = await pool.query(`${MENU_SELECT} WHERE m.id = ? LIMIT 1`, [
      result.insertId,
    ]);

    return res.status(201).json({
      success: true,
      message: "Menu added successfully.",
      data: formatMenuItem(rows[0]),
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ success: false, message: "Selected category does not exist." });
    }

    console.error("CREATE MENU ERROR:", error);
    next(error);
  }
};

/* =========================================
   UPDATE MENU  PUT /api/menu/:id
========================================= */

const updateMenu = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid menu id." });
    }

    const { category_id, name, portion, amount } = req.body;

    const validation = validateMenuInput(category_id, name, portion, amount);

    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const { numericCategoryId, menuName, portionName, numericAmount } = validation;

    const [result] = await pool.query(
      `
        UPDATE menu_items
        SET
          category_id = ?,
          name = ?,
          portion_type = ?,
          amount = ?
        WHERE id = ? AND is_active = 1
      `,
      [numericCategoryId, menuName, portionName, numericAmount, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    const [rows] = await pool.query(
      `${MENU_SELECT} WHERE m.id = ? AND m.is_active = 1 LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Menu updated successfully.",
      data: formatMenuItem(rows[0]),
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ success: false, message: "Selected category does not exist." });
    }

    console.error("UPDATE MENU ERROR:", error);
    next(error);
  }
};

/* =========================================
   DELETE MENU (soft delete)
========================================= */

const deleteMenu = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid menu id." });
    }

    const [result] = await pool.query(
      "UPDATE menu_items SET is_active = 0 WHERE id = ? AND is_active = 1",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    return res.status(200).json({ success: true, message: "Menu deleted successfully." });
  } catch (error) {
    console.error("DELETE MENU ERROR:", error);
    next(error);
  }
};

module.exports = {
  getPublicMenu,
  getAdminMenu,
  getPortions,
  createMenu,
  updateMenu,
  deleteMenu,
};