const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

// <backend root>/uploads/categories  (this file lives in src/middleware)
const UPLOAD_DIR = path.join(__dirname, "../../uploads/categories");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, unique + EXTENSIONS[file.mimetype]);
  },
});

const fileFilter = (req, file, cb) => {
  if (EXTENSIONS[file.mimetype]) return cb(null, true);

  const error = new Error("Only JPG, PNG or WEBP images are allowed.");
  error.code = "INVALID_IMAGE_TYPE";
  cb(error);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});