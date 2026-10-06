import { lazy, Suspense, useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

/* =========================================
   LAZY LOAD ADMIN PAGES
========================================= */

const CategoryPage = lazy(() => import("../pages/CategoryPage"));
const ProductsPage = lazy(() => import("../pages/ProductsPage"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const SettingsPage = lazy(
  () =>
    import(
      "../pages/SettingsPage"
    )
);

/* =========================================
   ALLOWED PAGES
========================================= */

const PAGES = ["category", "products", "orders", "settings",];

const getPageFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");

  return PAGES.includes(page) ? page : "products";
};

export default function AdminLayout({ onLogout }) {
  const [activePage, setActivePageState] = useState(getPageFromUrl);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* CHANGE PAGE */
  const setActivePage = (page) => {
    if (!PAGES.includes(page)) return;

    setActivePageState(page);

    const url = new URL(window.location.href);
    url.searchParams.set("page", page);
    window.history.pushState({ page }, "", url);
  };

  /* BROWSER BACK / FORWARD */
  useEffect(() => {
    const handlePopState = () => setActivePageState(getPageFromUrl());

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <Header onLogout={onLogout} setSidebarOpen={setSidebarOpen} />

      <main className="min-h-screen pt-[72px] lg:ml-[240px]">
        <div className="p-4 sm:p-6 lg:p-8">
          <Suspense
            fallback={
              <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm font-semibold text-slate-500">Loading...</p>
              </div>
            }
          >
            {activePage === "category" && <CategoryPage />}
            {activePage === "products" && <ProductsPage />}
            {activePage === "orders" && <OrdersPage />}
            {activePage === "settings" && ( <SettingsPage />)}
          </Suspense>
        </div>
      </main>
    </div>
  );
}