import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  addCategoryApi,
  deleteCategoryApi,
  getCategoriesApi,
  updateCategoryApi,
} from "../api/categoryApi";

const getMessage = (err, fallback) => err?.response?.data?.message || fallback;

/* Backend serves images from /uploads/... on the API server */
const IMAGE_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

const imageUrl = (path) => (path ? `${IMAGE_ORIGIN}${path}` : "");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null); // newly chosen file
  const [preview, setPreview] = useState(""); // preview of the new file
  const [existingImage, setExistingImage] = useState(""); // saved image (edit)
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  /* LOAD CATEGORIES */
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCategoriesApi();
      const data = res?.data?.data ?? res?.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Category fetch error:", err);
      setError(getMessage(err, "Unable to load categories."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /* PREVIEW URL FOR THE CHOSEN FILE */
  useEffect(() => {
    if (!imageFile) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setImageFile(null);
    setExistingImage("");
    setError("");
  };

  /* DRAWER OPEN / CLOSE */
  const openAddDrawer = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEditDrawer = (category) => {
    resetForm();
    setEditingId(category.id);
    setName(category.name);
    setExistingImage(imageUrl(category.own_image_path));
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
    resetForm();
  };

  /* IMAGE PICK */
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be 5MB or less.");
      return;
    }

    setError("");
    setImageFile(file);
  };

  /* SAVE / UPDATE */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const categoryName = name.trim();
    if (!categoryName) return setError("Please enter category name.");

    const formData = new FormData();
    formData.append("name", categoryName);
    if (imageFile) formData.append("image", imageFile);

    try {
      setSaving(true);
      setError("");

      if (editingId) await updateCategoryApi(editingId, formData);
      else await addCategoryApi(formData);

      setDrawerOpen(false);
      resetForm();
      loadCategories();
    } catch (err) {
      console.error("Category save error:", err);
      setError(
        getMessage(err, editingId ? "Unable to update category." : "Unable to add category.")
      );
    } finally {
      setSaving(false);
    }
  };

  /* DELETE */
  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    try {
      setDeletingId(category.id);
      setError("");
      await deleteCategoryApi(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      console.error("Category delete error:", err);
      setError(getMessage(err, "Unable to delete category."));
    } finally {
      setDeletingId(null);
    }
  };

  const shownImage = preview || existingImage;

  return (
    <div className="w-full min-w-0">
      {/* PAGE HEADER */}
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Category</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your product categories.</p>
        </div>

        <button
          type="button"
          onClick={openAddDrawer}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#ee027e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a50000] sm:px-5"
        >
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      {/* PAGE ERROR */}
      {error && !drawerOpen && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  S.No
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Image
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Category Name
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-16 text-center text-sm font-semibold text-slate-500">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((category, index) => (
                  <tr key={category.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">{index + 1}</td>
                    <td className="px-5 py-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                        {category.image_path && (
                          <img
                            src={imageUrl(category.image_path)}
                            alt={category.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-800">{category.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(category)}
                          title="Edit"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#ee027e]/30 hover:bg-[#ee027e]/10 hover:text-[#ee027e]"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === category.id}
                          onClick={() => handleDelete(category)}
                          title="Delete"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-5 py-16 text-center">
                    <p className="text-sm font-bold text-slate-800">No categories found</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Click Add Category to create your first category.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
          <p className="text-xs font-medium text-slate-500">
            Showing {categories.length === 0 ? 0 : 1} - {categories.length} of {categories.length}
          </p>
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
                  {editingId ? "Edit Category" : "Add Category"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {editingId ? "Update category details" : "Add a new category"}
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
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">Category Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Silk"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-800 outline-none transition focus:border-[#ee027e] focus:ring-2 focus:ring-[#ee027e]/10"
                />
              </div>

              {/* IMAGE */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Category Image
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 p-3 transition hover:border-[#ee027e] ${
                    saving ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                    {shownImage ? (
                      <img src={shownImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus size={26} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {shownImage ? "Change image" : "Choose image"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      JPG, PNG or WEBP, up to 5MB.
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-xs text-slate-400">
                  Optional. Without an image, the latest product photo in this category is shown.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg bg-red-50 px-3 py-3 text-sm font-medium leading-5 text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#ee027e] text-sm font-bold text-white transition hover:bg-[#a50000] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingId ? "Updating..." : "Saving..."
                  : editingId ? "Update Category" : "Save Category"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}