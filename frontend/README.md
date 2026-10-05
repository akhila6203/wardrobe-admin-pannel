# Biryani House Admin Panel

React + Tailwind CSS (Vite), mobile/tablet/desktop responsive.

## Run
npm install
npm run dev

## Demo Login
Email: admin@biryani.com
Password: admin123

## Storage
This demo uses browser localStorage for login, menu and orders. It is intentionally frontend-only. For production, replace localStorage auth/data with a backend API/database and real authentication.

Menu page: Add Menu opens a right-side drawer; fields are name, portion (Single/Double/Full), amount. Data is saved locally and paginated 10 rows/page.
Orders page: seeded dummy orders show customer/payment/order fields and pagination.
