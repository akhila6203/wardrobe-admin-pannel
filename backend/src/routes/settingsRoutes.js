const express =
  require("express");

const {
  protectAdmin,
} = require(
  "../middleware/authMiddleware"
);

const {
  getSettings,
  saveRazorpay,
  testRazorpay,
  saveShiprocket,
  testShiprocket,
} = require(
  "../controllers/settingsController"
);

const router =
  express.Router();

router.use(protectAdmin);

router.get(
  "/",
  getSettings
);

router.put(
  "/razorpay",
  saveRazorpay
);

router.post(
  "/razorpay/test",
  testRazorpay
);

router.put(
  "/shiprocket",
  saveShiprocket
);

router.post(
  "/shiprocket/test",
  testShiprocket
);

module.exports = router;