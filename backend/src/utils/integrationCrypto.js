const crypto = require("crypto");

const getKey = () => {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY is missing in backend .env."
    );
  }

  return crypto
    .createHash("sha256")
    .update(String(raw))
    .digest();
};

const encryptValue = (value) => {
  if (!value) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

const decryptValue = (value) => {
  if (!value) return "";

  const [ivHex, tagHex, encryptedHex] =
    String(value).split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted integration value.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(
    Buffer.from(tagHex, "hex")
  );

  return Buffer.concat([
    decipher.update(
      Buffer.from(encryptedHex, "hex")
    ),
    decipher.final(),
  ]).toString("utf8");
};

module.exports = {
  encryptValue,
  decryptValue,
};