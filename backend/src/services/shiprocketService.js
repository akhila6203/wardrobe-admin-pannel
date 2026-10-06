const {
  getShiprocketSettings,
} = require("./integrationService");

const SHIPROCKET_BASE_URL =
  "https://apiv2.shiprocket.in/v1/external";

const authenticateShiprocket = async ({
  requireEnabled = true,
} = {}) => {
  const settings =
    await getShiprocketSettings();

  if (!settings) {
    throw new Error(
      "Shiprocket settings are not configured."
    );
  }

  if (
    requireEnabled &&
    !settings.enabled
  ) {
    throw new Error(
      "Shiprocket integration is disabled."
    );
  }

  if (
    !settings.email ||
    !settings.password
  ) {
    throw new Error(
      "Shiprocket email and password are required."
    );
  }

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: settings.email,
        password: settings.password,
      }),
    }
  );

  const data = await response.json();

  if (
    !response.ok ||
    !data?.token
  ) {
    throw new Error(
      data?.message ||
      "Unable to authenticate with Shiprocket."
    );
  }

  return {
    token: data.token,
    settings,
  };
};

module.exports = {
  SHIPROCKET_BASE_URL,
  authenticateShiprocket,
};