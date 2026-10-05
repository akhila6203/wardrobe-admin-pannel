const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const BACKEND_ROOT = path.join(__dirname, "../..");

/* =========================================
   HELPERS
========================================= */

// Delete a category image from disk (ignore missing files)
const removeFile = (imagePath) => {
  if (!imagePath || !String(imagePath).startsWith("/uploads/categories/")) return;
  fs.unlink(path.join(BACKEND_ROOT, imagePath), () => {});
};

const uploadedPath = (file) =>
  file ? `/uploads/categories/${file.filename}` : null;

/* =========================================
   GET   /api/categories
   Plain array:
   [{ id, name, image_path, own_image_path }]
   - own_image_path : image uploaded for the category (or null)
   - image_path     : own image, otherwise the first image of the
                      newest product in the category (or null)
========================================= */

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.image_path AS own_image_path,
        COALESCE(
          c.image_path,
          (
            SELECT pi.image_path
            FROM product_images pi
            JOIN menu_items m ON m.id = pi.product_id
            WHERE m.category_id = c.id AND m.is_active = 1
            ORDER BY m.id DESC, pi.sort_order ASC, pi.id ASC
            LIMIT 1
          )
        ) AS image_path
      FROM categories c
      ORDER BY c.id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load categories" });
  }
};

/* =========================================
   POST  /api/categories   (multipart: name, image?)
========================================= */

exports.addCategory = async (req, res) => {
  const name = (req.body.name || "").trim();
  const imagePath = uploadedPath(req.file);

  if (!name) {
    removeFile(imagePath);
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO categories (name, image_path) VALUES (?, ?)",
      [name, imagePath]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      image_path: imagePath,
      own_image_path: imagePath,
    });
  } catch (err) {
    removeFile(imagePath);

    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "This category already exists" });

    console.error(err);
    res.status(500).json({ message: "Failed to add category" });
  }
};

/* =========================================
   PUT   /api/categories/:id   (multipart: name, image?)
   A new image replaces the old one. No image = keep the old one.
========================================= */

exports.updateCategory = async (req, res) => {
  const id = Number(req.params.id);
  const name = (req.body.name || "").trim();
  const newImage = uploadedPath(req.file);

  if (!Number.isInteger(id) || id <= 0) {
    removeFile(newImage);
    return res.status(400).json({ message: "Invalid category id" });
  }

  if (!name) {
    removeFile(newImage);
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT image_path FROM categories WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      removeFile(newImage);
      return res.status(404).json({ message: "Category not found" });
    }

    const oldImage = rows[0].image_path;

    if (newImage) {
      await pool.query(
        "UPDATE categories SET name = ?, image_path = ? WHERE id = ?",
        [name, newImage, id]
      );
      removeFile(oldImage);
    } else {
      await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
    }

    res.json({
      id,
      name,
      own_image_path: newImage || oldImage || null,
    });
  } catch (err) {
    removeFile(newImage);

    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "This category already exists" });

    console.error(err);
    res.status(500).json({ message: "Failed to update category" });
  }
};

/* =========================================
   DELETE /api/categories/:id
========================================= */

exports.deleteCategory = async (req, res) => {
  try {
    // Block delete if active menu items still use this category
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM menu_items WHERE category_id = ? AND is_active = 1",
      [req.params.id]
    );

    if (total > 0)
      return res.status(409).json({
        message: `This category has ${total} product(s). Move or delete them first.`,
      });

    const [existing] = await pool.query(
      "SELECT image_path FROM categories WHERE id = ?",
      [req.params.id]
    );

    // Removed (soft-deleted) menu items should not block the delete
    await pool.query(
      "UPDATE menu_items SET category_id = NULL WHERE category_id = ?",
      [req.params.id]
    );

    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Category not found" });

    removeFile(existing[0]?.image_path);

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};