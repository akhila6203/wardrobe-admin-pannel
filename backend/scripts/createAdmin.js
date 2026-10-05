const bcrypt =
  require("bcryptjs");

const dotenv =
  require("dotenv");

dotenv.config();

const pool =
  require(
    "../src/config/db"
  );

const createAdmin =
  async function () {
    try {
      const name =
        "Admin";

      const username =
        "admin";

      const email =
        "admin@thewardrobe.com";

      const password =
        "admin123";

      /* =====================================
         PASSWORD HASH
      ===================================== */

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      /* =====================================
         CHECK ADMIN
      ===================================== */

      const [existing] =
        await pool.query(
          `
          SELECT id
          FROM admins
          WHERE email = ?
             OR username = ?
          LIMIT 1
          `,
          [
            email,
            username,
          ]
        );

      if (
        existing.length > 0
      ) {
        console.log(
          "Admin already exists."
        );

        process.exit(0);
      }

      /* =====================================
         CREATE ADMIN
      ===================================== */

      await pool.query(
        `
        INSERT INTO admins
        (
          name,
          username,
          email,
          password_hash
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          name,
          username,
          email,
          passwordHash,
        ]
      );

      console.log(
        "Admin created successfully."
      );

      console.log(
        "Email:",
        email
      );

      console.log(
        "Password:",
        password
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "Admin creation failed:",
        error
      );

      process.exit(1);
    }
  };

createAdmin();