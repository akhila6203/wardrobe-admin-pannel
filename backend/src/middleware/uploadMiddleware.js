const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../../uploads/products");
fs.mkdirSync(uploadDir, { recursive: true });

const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${EXTENSIONS[file.mimetype]}`
    ),
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
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});