const express =
  require("express");
  const path = require("path");

const cors =
  require("cors");

const dotenv =
  require("dotenv");

dotenv.config();

const pool =
  require("./src/config/db");

const authRoutes =
  require("./src/routes/authRoutes");
  const categoryRoutes = require("./src/routes/categoryRoutes");
  const productRoutes = require("./src/routes/productRoutes");

const menuRoutes =
  require("./src/routes/menuRoutes");
  

const orderRoutes =
  require("./src/routes/orderRoutes");

const paymentRoutes =
  require("./src/routes/paymentRoutes");

  const cartRoutes =
  require(
    "./src/routes/cartRoutes"
  );

  const settingsRoutes =
  require("./src/routes/settingsRoutes");

const {
  notFound,
  errorHandler,
} = require(
  "./src/middleware/errorHandler"
);

const app =
  express();

const PORT =
  process.env.PORT ||
  5000;

/* =========================================
   CORS
========================================= */

const allowedOrigins = [
  process.env
    .ADMIN_FRONTEND_URL,

  process.env
    .USER_FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin:
      function (
        origin,
        callback
      ) {
        /*
         * Allows Postman and
         * server-to-server requests.
         */

        if (!origin) {
          return callback(
            null,
            true
          );
        }

        if (
          allowedOrigins.includes(
            origin
          )
        ) {
          return callback(
            null,
            true
          );
        }

        return callback(
          new Error(
            "Not allowed by CORS."
          )
        );
      },

    credentials: true,
  })
);

/* =========================================
   BODY PARSERS
========================================= */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================
   HEALTH API
========================================= */

app.get(
  "/api/health",
  async function (
    req,
    res,
    next
  ) {
    try {
      await pool.query(
        "SELECT 1"
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Backend and MySQL are connected.",
        });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================
   API ROUTES
========================================= */

app.use(
  "/api/auth",
  authRoutes
);
app.use("/api/categories", categoryRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/products", productRoutes);

app.use(
  "/api/menu",
  menuRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/cart",
  cartRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

/* =========================================
   404 + ERROR
========================================= */

app.use(notFound);

app.use(errorHandler);

/* =========================================
   START SERVER
========================================= */

const startServer =
  async function () {
    try {
      await pool.query(
        "SELECT 1"
      );

      console.log(
        "MySQL connected successfully."
      );

      app.listen(
        PORT,
        function () {
          console.log(
            "Server running on http://localhost:" +
              PORT
          );

          console.log(
            "API base URL: http://localhost:" +
              PORT +
              "/api"
          );
        }
      );
    } catch (error) {
      console.error(
        "Unable to connect to MySQL:",
        error.message
      );

      process.exit(1);
    }
  };

startServer();