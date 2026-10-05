const express = require("express");
const multer = require("multer");

const upload = require("../middleware/uploadMiddleware");
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

// TODO: add the same admin auth middleware you use in menuRoutes.js, e.g.
// router.use(yourAdminAuthMiddleware);

router.get("/", getProducts);
router.post("/", upload.array("images", 5), createProduct);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);

// Friendly upload errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 5MB or less."
        : "You can upload up to 5 images.";
    return res.status(400).json({ success: false, message });
  }

  if (err.code === "INVALID_IMAGE_TYPE") {
    return res.status(400).json({ success: false, message: err.message });
  }

  next(err);
});

module.exports = router;