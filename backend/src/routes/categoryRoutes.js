const express = require("express");
const multer = require("multer");

const upload = require("../middleware/categoryUploadMiddleware");
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

// GET is public (storefront). Put your admin auth middleware on
// POST / PUT / DELETE only, e.g.:
// router.post("/", yourAdminAuth, upload.single("image"), addCategory);

router.get("/", getCategories);
router.post("/", upload.single("image"), addCategory);
router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

// Friendly upload errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or less."
        : "Invalid image upload.";
    return res.status(400).json({ message });
  }

  if (err.code === "INVALID_IMAGE_TYPE") {
    return res.status(400).json({ message: err.message });
  }

  next(err);
});

module.exports = router;