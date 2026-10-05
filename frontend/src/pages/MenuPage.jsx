import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addMenuApi,
  deleteMenuApi,
  getAdminMenuApi,
  getPortionsApi,
  updateMenuApi,
} from "../api/menuApi";
import { getCategoriesApi } from "../api/categoryApi";

/* =========================================
   CONFIG
========================================= */

const ROWS_PER_PAGE = 10;
const DEFAULT_PORTIONS = ["Single", "Double", "Full"];

const INITIAL_FORM = {
  category_id: "",
  name: "",
  portion: "Single",
  amount: "",
};

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-800 outline-none transition focus:border-[#ee027e] focus:ring-2 focus:ring-[#ee027e]/10";

const TH_CLASS =
  "px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500";

/* =========================================
   MENU PAGE
========================================= */

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [portions, setPortions] = useState(DEFAULT_PORTIONS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [customPortion, setCustomPortion] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  /* =========================================
     LOAD MENU + PORTIONS + CATEGORIES
     (all APIs run in parallel)
  ========================================= */

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [menuResponse, portionResponse, categoryResponse] =
        await Promise.all([
          getAdminMenuApi(),
          getPortionsApi(),
          getCategoriesApi(),
        ]);

      /* MENU */
      const menuData = menuResponse?.data?.data;
      setMenuItems(Array.isArray(menuData) ? menuData : []);

      /* CATEGORIES */
      const categoryData =
        categoryResponse?.data?.data ?? categoryResponse?.data;
      setCategories(Array.isArray(categoryData) ? categoryData : []);

      /* PORTIONS */
      const portionData = portionResponse?.data?.data;

      if (Array.isArray(portionData)) {
        const cleanPortions = portionData
          .map((portion) => String(portion).trim())
          .filter(Boolean);

        setPortions([...new Set([...DEFAULT_PORTIONS, ...cleanPortions])]);
      } else {
        setPortions(DEFAULT_PORTIONS);
      }
    } catch (err) {
      console.error("Menu fetch error:", err);
      setError(err?.response?.data?.message || "Unable to load menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  /* =========================================
     PAGINATION
  ========================================= */

  const totalPages = Math.max(1, Math.ceil(menuItems.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return menuItems.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [menuItems, currentPage]);

  const previousPage = () => setCurrentPage((page) => Math.max(1, page - 1));
  const nextPage = () =>
    setCurrentPage((page) => Math.min(totalPages, page + 1));

  const startRow =
    menuItems.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(currentPage * ROWS_PER_PAGE, menuItems.length);

  /* =========================================
     DRAWER OPEN / CLOSE
  ========================================= */

  const openAddDrawer = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setCustomPortion("");
    setError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = (item) => {
    setEditingId(item.id);

    const portionExists = portions.includes(item.portion);

    setForm({
      category_id: item.category_id ?? "",
      name: item.name || "",
      portion: portionExists ? item.portion : "Other",
      amount: item.amount ?? "",
    });

    setCustomPortion(portionExists ? "" : item.portion || "");
    setError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;

    setDrawerOpen(false);
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setCustomPortion("");
    setError("");
  };

  /* =========================================
     FORM CHANGES
  ========================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handlePortionChange = (event) => {
    const value = event.target.value;

    setForm((previous) => ({ ...previous, portion: value }));

    if (value !== "Other") setCustomPortion("");
  };

  const addPortionToList = (portionName) => {
    const cleanName = String(portionName || "").trim();

    if (!cleanName) return;

    setPortions((previous) => {
      const alreadyExists = previous.some(
        (portion) => portion.toLowerCase() === cleanName.toLowerCase()
      );

      return alreadyExists ? previous : [...previous, cleanName];
    });
  };

  /* =========================================
     SAVE / UPDATE MENU
  ========================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    /* CATEGORY */
    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    /* MENU NAME */
    const menuName = form.name.trim();

    if (!menuName) {
      setError("Please enter menu name.");
      return;
    }

    /* PORTION */
    const finalPortion =
      form.portion === "Other" ? customPortion.trim() : form.portion;

    if (!finalPortion) {
      setError("Please enter portion name.");
      return;
    }

    if (finalPortion.length > 50) {
      setError("Portion name must be 50 characters or less.");
      return;
    }

    /* AMOUNT */
    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter valid amount.");
      return;
    }

    const payload = {
      category_id: Number(form.category_id),
      name: menuName,
      portion: finalPortion,
      amount,
    };

    try {
      setSaving(true);
      setError("");

      /* EDIT */
      if (editingId) {
        const response = await updateMenuApi(editingId, payload);
        const updatedItem = response?.data?.data;

        if (updatedItem) {
          setMenuItems((previous) =>
            previous.map((item) =>
              Number(item.id) === Number(editingId) ? updatedItem : item
            )
          );

          addPortionToList(updatedItem.portion);
        } else {
          await loadMenu();
        }
      } else {
        /* ADD */
        const response = await addMenuApi(payload);
        const newItem = response?.data?.data;

        if (newItem) {
          setMenuItems((previous) => [newItem, ...previous]);
          addPortionToList(newItem.portion);
        } else {
          await loadMenu();
        }

        setCurrentPage(1);
      }

      setDrawerOpen(false);
      setEditingId(null);
      setForm({ ...INITIAL_FORM });
      setCustomPortion("");
      setError("");
    } catch (err) {
      console.error("Menu save error:", err);

      setError(
        err?.response?.data?.message ||
          (editingId ? "Unable to update menu." : "Unable to add menu.")
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     DELETE MENU
  ========================================= */

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.name}" - ${item.portion}?`);

    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setError("");

      await deleteMenuApi(item.id);

      setMenuItems((previous) =>
        previous.filter((menuItem) => Number(menuItem.id) !== Number(item.id))
      );
    } catch (err) {
      console.error("Menu delete error:", err);
      setError(err?.response?.data?.message || "Unable to delete menu.");
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="w-full min-w-0">
      {/* PAGE HEADER */}
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Menu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your restaurant menu.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDrawer}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#ee027e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a50000] sm:px-5"
        >
          <Plus size={18} />
          <span>Add Menu</span>
        </button>
      </div>

      {/* PAGE ERROR */}
      {error && !drawerOpen && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* MENU TABLE */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className={TH_CLASS}>S.No</th>
                <th className={TH_CLASS}>Category</th>
                <th className={TH_CLASS}>Menu Name</th>
                <th className={TH_CLASS}>Portion</th>
                <th className={TH_CLASS}>Amount</th>
                <th className={`${TH_CLASS} text-center`}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-16 text-center text-sm font-semibold text-slate-500"
                  >
                    Loading menu...
                  </td>
                </tr>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {item.category_name || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-800">
                        {item.name}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-[#ee027e]/10 px-3 py-1 text-xs font-bold text-[#ee027e]">
                        {item.portion}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap text-sm font-black text-slate-900">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#ee027e]/30 hover:bg-[#ee027e]/10 hover:text-[#ee027e]"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <p className="text-sm font-bold text-slate-800">
                      No menu items found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Click Add Menu to create your first item.
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
            Showing {startRow} - {endRow} of {menuItems.length}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={previousPage}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="min-w-[55px] text-center text-sm font-bold text-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={nextPage}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]">
          <div onClick={closeDrawer} className="absolute inset-0 bg-black/40" />

          <div className="absolute right-0 top-0 h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-[400px]">
            {/* DRAWER HEADER */}
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingId ? "Edit Menu" : "Add Menu"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {editingId
                    ? "Update menu item details"
                    : "Add a new menu item"}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="p-5">
              {/* CATEGORY (first field) */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Category
                </label>

                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className={`${INPUT_CLASS} bg-white`}
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {categories.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    No categories yet. Add one from the Category page first.
                  </p>
                )}
              </div>

              {/* MENU NAME */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Menu Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter menu name"
                  className={INPUT_CLASS}
                />
              </div>

              {/* PORTION */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Portion
                </label>

                <select
                  name="portion"
                  value={form.portion}
                  onChange={handlePortionChange}
                  className={`${INPUT_CLASS} bg-white`}
                >
                  {portions.map((portion) => (
                    <option key={portion} value={portion}>
                      {portion}
                    </option>
                  ))}

                  <option value="Other">Other</option>
                </select>

                {form.portion === "Other" && (
                  <input
                    type="text"
                    value={customPortion}
                    onChange={(event) => setCustomPortion(event.target.value)}
                    maxLength={50}
                    placeholder="Enter portion name"
                    className={`mt-3 ${INPUT_CLASS}`}
                  />
                )}
              </div>

              {/* AMOUNT */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className={INPUT_CLASS}
                />
              </div>

              {/* FORM ERROR */}
              {error && (
                <div className="mb-5 rounded-lg bg-red-50 px-3 py-3 text-sm font-medium leading-5 text-red-600">
                  {error}
                </div>
              )}

              {/* SAVE / UPDATE BUTTON */}
              <button
                type="submit"
                disabled={saving}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#ee027e] text-sm font-bold text-white transition hover:bg-[#a50000] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Saving..."
                  : editingId
                  ? "Update Menu"
                  : "Save Menu"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}