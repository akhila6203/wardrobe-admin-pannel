const db = require("../config/db");


/* =========================================
   GET PROVIDER
========================================= */

const getProvider = async (
  provider
) => {
  const [rows] =
    await db.query(
      `
        SELECT *
        FROM integration_settings
        WHERE provider = ?
        LIMIT 1
      `,
      [provider]
    );

  return rows[0] || null;
};


/* =========================================
   RAZORPAY SETTINGS
========================================= */

const getRazorpaySettings =
  async () => {

    const row =
      await getProvider(
        "razorpay"
      );


    if (!row) {
      return null;
    }


    return {
      enabled:
        Number(
          row.is_enabled
        ) === 1,

      keyId:
        row.public_key || "",

      keySecret:
        row.secret_value || "",
    };
  };


/* =========================================
   SHIPROCKET SETTINGS
========================================= */

const getShiprocketSettings =
  async () => {

    const row =
      await getProvider(
        "shiprocket"
      );


    if (!row) {
      return null;
    }


    return {
      enabled:
        Number(
          row.is_enabled
        ) === 1,

      email:
        row.email || "",

      password:
        row.password_value || "",

      pickupLocation:
        row.pickup_location || "",

      channelId:
        row.channel_id || "",
    };
  };


module.exports = {
  getProvider,
  getRazorpaySettings,
  getShiprocketSettings,
};