import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getOrdersApi } from "../api/orderApi";
import { downloadOrdersPdf, formatOrderDate } from "../utils/orderPdf";

const ROWS_PER_PAGE = 10;

const TH_CLASS =
  "whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-slate-500";

/* =========================================
   HELPERS
========================================= */

const buildAddress = (order) => {
  const main =
    order.address ||
    order.deliveryAddress ||
    order.delivery_address ||
    order.customerAddress ||
    order.customer_address ||
    order.shippingAddress ||
    order.shipping_address ||
    "";

  const extra = [order.city, order.state, order.pincode || order.pin_code]
    .filter(Boolean)
    .join(", ");

  return [main, extra].filter(Boolean).join(", ") || "-";
};

const buildOrderId = (order, fallback) =>
  order.orderNumber ||
  order.order_number ||
  order.orderId ||
  order.order_id ||
  order.id ||
  fallback;

/* One table row = one ordered item */
const buildRow = (order, item, rowKey, orderIndex) => ({
  rowKey,

  orderId: buildOrderId(order, orderIndex + 1),

  customerName: order.customerName || order.customer_name || order.name || "-",

  mobile: order.mobile || order.mobileNumber || order.phone || "-",

  address: buildAddress(order),

  itemName:
    item.itemName ||
    item.item_name ||
    item.item ||
    item.menuName ||
    item.menu_name ||
    item.productName ||
    item.product_name ||
    "-",

  portion:
    item.portion || item.portionType || item.portion_type || item.size || "-",

  quantity: Number(item.quantity ?? item.qty ?? 0),

  paymentMethod:
    order.paymentMethod ||
    order.payment_method ||
    order.paymentMode ||
    order.payment_mode ||
    "Razorpay",

  totalAmount: Number(
    order.itemTotalAmount ??
      order.item_total_amount ??
      order.totalAmount ??
      order.total_amount ??
      order.total ??
      order.grandTotal ??
      0
  ),

  createdAt: order.createdAt || order.created_at || null,
});

const formatAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

/* =========================================
   ORDERS PAGE
========================================= */

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedKeys, setSelectedKeys] = useState([]);
  const [downloading, setDownloading] = useState(false);

  /* LOAD ORDERS */
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrdersApi();
      const apiOrders = response?.data?.data;

      setOrders(Array.isArray(apiOrders) ? apiOrders : []);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setOrders([]);
      setError(err?.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* NORMALIZE ORDER DATA (flat or nested items) */
  const orderRows = useMemo(() => {
    const rows = [];

    orders.forEach((order, orderIndex) => {
      const nestedItems = Array.isArray(order?.items) ? order.items : [];

      if (nestedItems.length > 0) {
        nestedItems.forEach((item, itemIndex) => {
          rows.push(
            buildRow(
              order,
              item,
              `${order.id || order.orderId || orderIndex}-${item.id || itemIndex}`,
              orderIndex
            )
          );
        });
        return;
      }

      rows.push(
        buildRow(
          order,
          order,
          `order-${order.id || order.orderId || orderIndex}`,
          orderIndex
        )
      );
    });

    return rows;
  }, [orders]);

  /* PAGINATION */
  const totalPages = Math.max(1, Math.ceil(orderRows.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return orderRows.slice(start, start + ROWS_PER_PAGE);
  }, [orderRows, currentPage]);

  /* SELECTION */
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const pageKeys = paginatedOrders.map((row) => row.rowKey);
  const allPageSelected =
    pageKeys.length > 0 && pageKeys.every((key) => selectedSet.has(key));
  const somePageSelected = pageKeys.some((key) => selectedSet.has(key));

  const toggleRow = (key) => {
    setSelectedKeys((previous) =>
      previous.includes(key)
        ? previous.filter((k) => k !== key)
        : [...previous, key]
    );
  };

  const togglePage = () => {
    setSelectedKeys((previous) => {
      if (allPageSelected) {
        return previous.filter((key) => !pageKeys.includes(key));
      }

      return [...new Set([...previous, ...pageKeys])];
    });
  };

  /* DOWNLOAD PDF (selected rows, in table order) */
  const handleDownloadPdf = async () => {
    const selectedRows = orderRows.filter((row) => selectedSet.has(row.rowKey));

    if (selectedRows.length === 0) return;

    try {
      setDownloading(true);
      setError("");

      await downloadOrdersPdf(selectedRows);
    } catch (err) {
      console.error("PDF error:", err);
      setError("Unable to create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full min-w-0">
      {/* PAGE HEADER */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Orders</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            View customer order and delivery details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={selectedKeys.length === 0 || downloading}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#ee027e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a50000] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
        >
          <Download size={18} />
          <span>
            {downloading
              ? "Preparing PDF..."
              : selectedKeys.length > 0
              ? `Download PDF (${selectedKeys.length})`
              : "Download PDF"}
          </span>
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* ORDERS TABLE */}
      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white sm:rounded-2xl">
        <div className="w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[1400px] border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-12 px-5 py-4">
                  <input
                    type="checkbox"
                    aria-label="Select all orders on this page"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={togglePage}
                    disabled={pageKeys.length === 0}
                    className="h-4 w-4 cursor-pointer accent-[#ee027e]"
                  />
                </th>
                <th className={`min-w-[100px] ${TH_CLASS}`}>Order ID</th>
                <th className={`min-w-[150px] ${TH_CLASS}`}>Customer</th>
                <th className={`min-w-[140px] ${TH_CLASS}`}>Mobile</th>
                <th className={`min-w-[260px] ${TH_CLASS}`}>Address</th>
                <th className={`min-w-[180px] ${TH_CLASS}`}>Order Item</th>
                <th className={`min-w-[120px] ${TH_CLASS}`}>Portion</th>
                <th className={`min-w-[100px] text-center ${TH_CLASS}`}>Quantity</th>
                <th className={`min-w-[130px] ${TH_CLASS}`}>Item Total</th>
                <th className={`min-w-[190px] ${TH_CLASS}`}>Order Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-500">Loading orders...</p>
                  </td>
                </tr>
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const selected = selectedSet.has(order.rowKey);

                  return (
                    <tr
                      key={order.rowKey}
                      className={`border-t border-slate-100 transition ${
                        selected ? "bg-[#ee027e]/5" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select order ${order.orderId}`}
                          checked={selected}
                          onChange={() => toggleRow(order.rowKey)}
                          className="h-4 w-4 cursor-pointer accent-[#ee027e]"
                        />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="text-sm font-bold text-slate-800">#{order.orderId}</span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="text-sm font-semibold text-slate-800">{order.customerName}</span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="text-sm text-slate-600">{order.mobile}</span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="block max-w-[300px] text-sm leading-5 text-slate-600">
                          {order.address}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">{order.itemName}</span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex rounded-full bg-[#ee027e]/10 px-3 py-1 text-xs font-semibold text-[#ee027e]">
                          {order.portion}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-center">
                        <span className="text-sm font-bold text-slate-800">{order.quantity}</span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="text-sm font-black text-slate-900">
                          {formatAmount(order.totalAmount)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="text-sm font-medium text-slate-600">
                          {formatOrderDate(order.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="px-5 py-16 text-center">
                    <p className="text-sm font-bold text-slate-700">No orders found</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Successful customer orders will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs font-medium text-slate-500">
            Showing {orderRows.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1}
            {" - "}
            {Math.min(currentPage * ROWS_PER_PAGE, orderRows.length)} of {orderRows.length}
            {selectedKeys.length > 0 && ` | ${selectedKeys.length} selected`}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="min-w-[55px] whitespace-nowrap text-center text-sm font-bold text-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-slate-400 lg:hidden">
        Swipe left or right to view all order details
      </p>
    </div>
  );
}