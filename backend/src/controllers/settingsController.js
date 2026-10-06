const Razorpay = require("razorpay");

const db = require("../config/db");

const {
  getRazorpaySettings,
  getShiprocketSettings,
} = require("../services/integrationService");

const {
  authenticateShiprocket,
} = require("../services/shiprocketService");


/* =========================================================
   GET ADMIN SETTINGS
========================================================= */

/* =========================================
   GET ADMIN SETTINGS
========================================= */

exports.getSettings = async (req, res) => {
  try {
    const razorpay =
      await getRazorpaySettings();

    const shiprocket =
      await getShiprocketSettings();

    return res.status(200).json({
      success: true,

      data: {
        razorpay: {
          enabled:
            Boolean(razorpay?.enabled),

          key_id:
            razorpay?.keyId || "",

          // Admin settings page kosam
          key_secret:
            razorpay?.keySecret || "",

          has_secret:
            Boolean(
              razorpay?.keySecret
            ),
        },

        shiprocket: {
          enabled:
            Boolean(shiprocket?.enabled),

          email:
            shiprocket?.email || "",

          // Admin settings page kosam
          password:
            shiprocket?.password || "",

          pickup_location:
            shiprocket?.pickupLocation || "",

          channel_id:
            shiprocket?.channelId || "",

          has_password:
            Boolean(
              shiprocket?.password
            ),
        },
      },
    });

  } catch (error) {
    console.error(
      "GET SETTINGS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load settings.",
    });
  }
};


/* =========================================================
   SAVE RAZORPAY

   Credentials come from:
   Admin Settings Page
            ↓
   integration_settings table

   NO Razorpay credentials from .env
========================================================= */

exports.saveRazorpay = async (req, res) => {
  try {
    const {
      enabled,
      key_id,
      key_secret,
    } = req.body;


    /* =========================
       CLEAN VALUES
    ========================= */

    const keyId =
      String(
        key_id || ""
      ).trim();


    const keySecret =
      String(
        key_secret || ""
      ).trim();


    /* =========================
       GET EXISTING RAZORPAY ROW
    ========================= */

    const [existingRows] =
      await db.query(
        `
          SELECT *
          FROM integration_settings
          WHERE provider = 'razorpay'
          LIMIT 1
        `
      );


    const existing =
      existingRows[0] || null;


    /* =========================
       VALIDATION
    ========================= */

    if (
      Boolean(enabled) &&
      !keyId
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Razorpay Key ID is required.",
      });
    }


    /*
     * If Razorpay is enabled:
     *
     * Secret is required when:
     * - user did not enter new secret
     * - database also doesn't have one
     */

    if (
      Boolean(enabled) &&
      !keySecret &&
      !existing?.secret_value
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Razorpay Key Secret is required.",
      });
    }


    /* =========================
       SECRET TO SAVE

       IMPORTANT:
       No encryptValue()
       No .env encryption key.

       If admin leaves field blank,
       retain existing DB secret.
    ========================= */

    const secretToSave =
      keySecret
        ? keySecret
        : existing?.secret_value ||
          null;


    /* =========================
       SAVE TO DATABASE
    ========================= */

    await db.query(
      `
        INSERT INTO integration_settings
        (
          provider,
          is_enabled,
          public_key,
          secret_value
        )

        VALUES
        (
          'razorpay',
          ?,
          ?,
          ?
        )

        ON DUPLICATE KEY UPDATE

          is_enabled =
            VALUES(is_enabled),

          public_key =
            VALUES(public_key),

          secret_value =
            VALUES(secret_value),

          updated_at =
            CURRENT_TIMESTAMP
      `,
      [
        enabled ? 1 : 0,
        keyId,
        secretToSave,
      ]
    );


    return res.status(200).json({
      success: true,

      message:
        "Razorpay settings saved successfully.",
    });

  } catch (error) {

    console.error(
      "SAVE RAZORPAY ERROR:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to save Razorpay settings.",
    });
  }
};


/* =========================================================
   TEST RAZORPAY

   Uses credentials stored in database.
========================================================= */

exports.testRazorpay = async (req, res) => {
  try {
    /* =========================
       GET SETTINGS FROM DB
    ========================= */

    const settings =
      await getRazorpaySettings();


    /* =========================
       CHECK CREDENTIALS
    ========================= */

    if (
      !settings?.keyId ||
      !settings?.keySecret
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Save Razorpay credentials first.",
      });
    }


    /* =========================
       CREATE RAZORPAY INSTANCE

       Credentials are from DB,
       NOT .env
    ========================= */

    const razorpay =
      new Razorpay({
        key_id:
          settings.keyId,

        key_secret:
          settings.keySecret,
      });


    /* =========================
       TEST API CONNECTION

       Does NOT create payment.
    ========================= */

    await razorpay.orders.all({
      count: 1,
    });


    return res.status(200).json({
      success: true,

      message:
        "Razorpay connection successful.",
    });

  } catch (error) {

    console.error(
      "TEST RAZORPAY ERROR:",
      error
    );


    return res.status(400).json({
      success: false,

      message:
        "Razorpay connection failed. Check Key ID and Key Secret.",
    });
  }
};


/* =========================================================
   SAVE SHIPROCKET

   Credentials come from:
   Admin Settings Page
            ↓
   integration_settings table

   NO Shiprocket credentials from .env
========================================================= */

exports.saveShiprocket = async (
  req,
  res
) => {
  try {
    const {
      enabled,
      email,
      password,
      pickup_location,
      channel_id,
    } = req.body;


    /* =========================
       CLEAN VALUES
    ========================= */

    const finalEmail =
      String(
        email || ""
      ).trim();


    const finalPassword =
      String(
        password || ""
      ).trim();


    const pickupLocation =
      String(
        pickup_location || ""
      ).trim();


    const channelId =
      String(
        channel_id || ""
      ).trim();


    /* =========================
       GET EXISTING SHIPROCKET
    ========================= */

    const [existingRows] =
      await db.query(
        `
          SELECT *
          FROM integration_settings
          WHERE provider = 'shiprocket'
          LIMIT 1
        `
      );


    const existing =
      existingRows[0] || null;


    /* =========================
       VALIDATION
    ========================= */

    if (
      Boolean(enabled) &&
      !finalEmail
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Shiprocket API email is required.",
      });
    }


    /*
     * Password required only when:
     *
     * Shiprocket is enabled
     * AND
     * no new password supplied
     * AND
     * no existing DB password
     */

    if (
      Boolean(enabled) &&
      !finalPassword &&
      !existing?.password_value
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Shiprocket API password is required.",
      });
    }


    if (
      Boolean(enabled) &&
      !pickupLocation
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Shiprocket pickup location is required.",
      });
    }


    /* =========================
       PASSWORD TO SAVE

       No encryption .env key.

       If field blank:
       keep existing DB password.
    ========================= */

    const passwordToSave =
      finalPassword
        ? finalPassword
        : existing?.password_value ||
          null;


    /* =========================
       SAVE TO DATABASE
    ========================= */

    await db.query(
      `
        INSERT INTO integration_settings
        (
          provider,
          is_enabled,
          email,
          password_value,
          pickup_location,
          channel_id
        )

        VALUES
        (
          'shiprocket',
          ?,
          ?,
          ?,
          ?,
          ?
        )

        ON DUPLICATE KEY UPDATE

          is_enabled =
            VALUES(is_enabled),

          email =
            VALUES(email),

          password_value =
            VALUES(password_value),

          pickup_location =
            VALUES(pickup_location),

          channel_id =
            VALUES(channel_id),

          updated_at =
            CURRENT_TIMESTAMP
      `,
      [
        enabled ? 1 : 0,
        finalEmail,
        passwordToSave,
        pickupLocation,
        channelId || null,
      ]
    );


    return res.status(200).json({
      success: true,

      message:
        "Shiprocket settings saved successfully.",
    });

  } catch (error) {

    console.error(
      "SAVE SHIPROCKET ERROR:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to save Shiprocket settings.",
    });
  }
};


/* =========================================================
   TEST SHIPROCKET

   shiprocketService must read credentials
   through getShiprocketSettings() from DB.
========================================================= */

exports.testShiprocket = async (
  req,
  res
) => {
  try {
    await authenticateShiprocket({
      requireEnabled: false,
    });


    return res.status(200).json({
      success: true,

      message:
        "Shiprocket connection successful.",
    });

  } catch (error) {

    console.error(
      "SHIPROCKET TEST ERROR:",
      error
    );


    return res.status(400).json({
      success: false,

      message:
        error.message ||
        "Shiprocket connection failed. Check your credentials.",
    });
  }
};