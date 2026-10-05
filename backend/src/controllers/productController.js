const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const MAX_IMAGES = 5;
const MAX_DESCRIPTION_WORDS = 100;
const MAX_DESCRIPTION_CHARS = 1000;
const BACKEND_ROOT = path.join(__dirname, "../..");

/* =========================================
   HELPERS
========================================= */

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// Delete image files from disk (ignore missing files)
const removeFiles = (imagePaths) => {
  imagePaths.forEach((imagePath) => {
    if (!String(imagePath).startsWith("/uploads/products/")) return;
    fs.unlink(path.join(BACKEND_ROOT, imagePath), () => {});
  });
};

const removeUploaded = (files) =>
  removeFiles((files || []).map((f) => `/uploads/products/${f.filename}`));

const parseSizes = (raw) => {
  let list;

  try {
    list = JSON.parse(raw);
  } catch {
    return { error: "Invalid sizes." };
  }

  if (!Array.isArray(list) || list.length === 0) {
    return { error: "Add at least one size and price." };
  }

  const seen = new Set();
  const sizes = [];

  for (const row of list) {
    const size = String(row?.size || "").trim();
    const price = Number(row?.price);

    if (!size) return { error: "Size is required in every row." };
    if (size.length > 20) return { error: "Size must be 20 characters or less." };

    if (!Number.isFinite(price) || price <= 0) {
      return { error: `Enter a valid price for size ${size}.` };
    }

    const key = size.toLowerCase();
    if (seen.has(key)) return { error: `Size ${size} is added twice.` };

    seen.add(key);
    sizes.push({ size, price });
  }

  return { sizes };
};

const validateProduct = (body) => {
  const categoryId = Number(body.category_id);
  const name = String(body.name || "").trim();

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { error: "Please select a category." };
  }

  if (!name) return { error: "Product name is required." };

  /* DESCRIPTION - optional, up to 100 words */
  const description = String(body.description || "").trim();
  const wordCount = description ? description.split(/\s+/).length : 0;

  if (wordCount > MAX_DESCRIPTION_WORDS) {
    return {
      error: `Description must be ${MAX_DESCRIPTION_WORDS} words or less (now ${wordCount}).`,
    };
  }

  if (description.length > MAX_DESCRIPTION_CHARS) {
    return {
      error: `Description must be ${MAX_DESCRIPTION_CHARS} characters or less.`,
    };
  }

  const parsed = parseSizes(body.sizes);
  if (parsed.error) return { error: parsed.error };

  return { categoryId, name, description, sizes: parsed.sizes };
};

// Load active products with category, sizes and images (newest first).
// limit = 0 means no limit.
const loadProducts = async (conn, extraWhere = "", params = [], limit = 0) => {
  const [rows] = await conn.query(
    `
      SELECT
        m.id, m.category_id, c.name AS category_name,
        m.name, m.description, m.created_at, m.updated_at
      FROM menu_items m
      LEFT JOIN categories c ON c.id = m.category_id
      WHERE m.is_active = 1 ${extraWhere}
      ORDER BY m.id DESC
      ${limit ? "LIMIT ?" : ""}
    `,
    limit ? [...params, limit] : params
  );

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);

  const [sizes] = await conn.query(
    "SELECT id, product_id, size, price FROM product_sizes WHERE product_id IN (?) ORDER BY id ASC",
    [ids]
  );

  const [images] = await conn.query(
    "SELECT id, product_id, image_path FROM product_images WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC",
    [ids]
  );

  return rows.map((row) => ({
    id: row.id,
    category_id: row.category_id ?? null,
    category_name: row.category_name || null,
    name: row.name,
    description: row.description || "",
    sizes: sizes
      .filter((s) => s.product_id === row.id)
      .map((s) => ({ id: s.id, size: s.size, price: Number(s.price) })),
    images: images
      .filter((i) => i.product_id === row.id)
      .map((i) => ({ id: i.id, path: i.image_path })),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }));
};

const handleError = (error, files, res, next) => {
  removeUploaded(files);

  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return res
      .status(400)
      .json({ success: false, message: "Selected category does not exist." });
  }

  console.error("PRODUCT ERROR:", error);
  next(error);
};

/* =========================================
   GET PRODUCTS   GET /api/products
   Optional query:
     ?category_id=3   products of one category
     ?limit=4         newest N products
========================================= */

const getProducts = async (req, res, next) => {
  try {
    const categoryId = Number(req.query.category_id);
    const limit = Math.min(Math.max(Number(req.query.limit) || 0, 0), 50);

    const hasCategory = Number.isInteger(categoryId) && categoryId > 0;
    const where = hasCategory ? "AND m.category_id = ?" : "";
    const params = hasCategory ? [categoryId] : [];

    const data = await loadProducts(pool, where, params, limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    next(error);
  }
};

/* =========================================
   CREATE PRODUCT   POST /api/products
========================================= */

const createProduct = async (req, res, next) => {
  const files = req.files || [];
  const validation = validateProduct(req.body);

  if (validation.error) {
    removeUploaded(files);
    return res.status(400).json({ success: false, message: validation.error });
  }

  const { categoryId, name, description, sizes } = validation;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // portion_type + amount keep the first size so the old
    // cart / order / public-menu code keeps working.
    const [result] = await conn.query(
      `INSERT INTO menu_items (category_id, name, description, portion_type, amount, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [categoryId, name, description || null, sizes[0].size, sizes[0].price]
    );

    const productId = result.insertId;

    await conn.query("INSERT INTO product_sizes (product_id, size, price) VALUES ?", [
      sizes.map((s) => [productId, s.size, s.price]),
    ]);

    if (files.length > 0) {
      await conn.query(
        "INSERT INTO product_images (product_id, image_path, sort_order) VALUES ?",
        [files.map((f, i) => [productId, `/uploads/products/${f.filename}`, i])]
      );
    }

    const [product] = await loadProducts(conn, "AND m.id = ?", [productId]);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Product added successfully.",
      data: product,
    });
  } catch (error) {
    await conn.rollback();
    handleError(error, files, res, next);
  } finally {
    conn.release();
  }
};

/* =========================================
   UPDATE PRODUCT   PUT /api/products/:id
========================================= */

const updateProduct = async (req, res, next) => {
  const files = req.files || [];
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    removeUploaded(files);
    return res.status(400).json({ success: false, message: "Invalid product id." });
  }

  const validation = validateProduct(req.body);

  if (validation.error) {
    removeUploaded(files);
    return res.status(400).json({ success: false, message: validation.error });
  }

  const { categoryId, name, description, sizes } = validation;

  let keepIds = [];
  try {
    const parsed = JSON.parse(req.body.keep_image_ids || "[]");
    keepIds = Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    keepIds = [];
  }

  const conn = await pool.getConnection();
  let removedPaths = [];

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `UPDATE menu_items
       SET category_id = ?, name = ?, description = ?, portion_type = ?, amount = ?
       WHERE id = ? AND is_active = 1`,
      [categoryId, name, description || null, sizes[0].size, sizes[0].price, id]
    );

    if (result.affectedRows === 0) throw httpError(404, "Product not found.");

    /* SIZES - replace all */
    await conn.query("DELETE FROM product_sizes WHERE product_id = ?", [id]);
    await conn.query("INSERT INTO product_sizes (product_id, size, price) VALUES ?", [
      sizes.map((s) => [id, s.size, s.price]),
    ]);

    /* IMAGES - drop removed, add new */
    const [existing] = await conn.query(
      "SELECT id, image_path FROM product_images WHERE product_id = ?",
      [id]
    );

    const kept = existing.filter((img) => keepIds.includes(img.id));
    const removed = existing.filter((img) => !keepIds.includes(img.id));

    if (kept.length + files.length > MAX_IMAGES) {
      throw httpError(400, `You can upload up to ${MAX_IMAGES} images.`);
    }

    if (removed.length > 0) {
      await conn.query("DELETE FROM product_images WHERE id IN (?)", [
        removed.map((img) => img.id),
      ]);
    }

    if (files.length > 0) {
      await conn.query(
        "INSERT INTO product_images (product_id, image_path, sort_order) VALUES ?",
        [
          files.map((f, i) => [
            id,
            `/uploads/products/${f.filename}`,
            kept.length + i,
          ]),
        ]
      );
    }

    removedPaths = removed.map((img) => img.image_path);

    const [product] = await loadProducts(conn, "AND m.id = ?", [id]);

    await conn.commit();

    removeFiles(removedPaths);

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    await conn.rollback();
    handleError(error, files, res, next);
  } finally {
    conn.release();
  }
};

/* =========================================
   DELETE PRODUCT (soft delete)
========================================= */

const deleteProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product id." });
    }

    const [result] = await pool.query(
      "UPDATE menu_items SET is_active = 0 WHERE id = ? AND is_active = 1",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.status(200).json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    next(error);
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };