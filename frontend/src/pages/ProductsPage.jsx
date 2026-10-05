import {
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    ImagePlus,
    Pencil,
    Plus,
    Trash2,
    X,
  } from "lucide-react";
  import { useCallback, useEffect, useMemo, useState } from "react";
  
  import {
    addProductApi,
    deleteProductApi,
    getAdminProductsApi,
    getImageUrl,
    updateProductApi,
  } from "../api/productApi";
  import { getCategoriesApi } from "../api/categoryApi";
  
  /* =========================================
     CONFIG
  ========================================= */
  
  const ROWS_PER_PAGE = 10;
  const MAX_IMAGES = 5;
  const MAX_SIZES = 10;
  const MAX_IMAGE_MB = 5;
  const MAX_DESCRIPTION_WORDS = 100;
  const SIZE_SUGGESTIONS = ["S", "M", "L", "XL", "XXL"];
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  
  const INPUT_BASE =
    "h-12 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none transition focus:border-[#ee027e] focus:ring-2 focus:ring-[#ee027e]/10";
  
  const INPUT_CLASS = `${INPUT_BASE} w-full px-4`;
  
  const TH_CLASS =
    "px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500";
  
  /* Next suggested size (S, M, L, XL, XXL) that is not used yet */
  const nextSizeRow = (rows) => {
    const used = rows.map((row) => row.size.trim().toLowerCase());
    const suggestion = SIZE_SUGGESTIONS.find((s) => !used.includes(s.toLowerCase()));
  
    return { size: suggestion || "", price: "" };
  };
  
  const countWords = (text) => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };
  
  /* Cut text right after the 100th word (keeps spaces/new lines as typed) */
  const limitWords = (text) => {
    const words = [...text.matchAll(/\S+/g)];
    if (words.length <= MAX_DESCRIPTION_WORDS) return text;
  
    const last = words[MAX_DESCRIPTION_WORDS - 1];
    return text.slice(0, last.index + last[0].length);
  };
  
  /* =========================================
     PRODUCTS PAGE
  ========================================= */
  
  export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
  
    const [categoryId, setCategoryId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [sizes, setSizes] = useState([nextSizeRow([])]);
    const [existingImages, setExistingImages] = useState([]); // saved on server
    const [newImages, setNewImages] = useState([]); // picked, not uploaded yet
  
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
  
    const descriptionWords = countWords(description);
  
    /* =========================================
       LOAD PRODUCTS + CATEGORIES
    ========================================= */
  
    const loadProducts = useCallback(async () => {
      try {
        setLoading(true);
        setError("");
  
        const [productResponse, categoryResponse] = await Promise.all([
          getAdminProductsApi(),
          getCategoriesApi(),
        ]);
  
        const productData = productResponse?.data?.data;
        setProducts(Array.isArray(productData) ? productData : []);
  
        const categoryData = categoryResponse?.data?.data ?? categoryResponse?.data;
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        console.error("Product fetch error:", err);
        setError(err?.response?.data?.message || "Unable to load products.");
      } finally {
        setLoading(false);
      }
    }, []);
  
    useEffect(() => {
      loadProducts();
    }, [loadProducts]);
  
    /* =========================================
       PAGINATION
    ========================================= */
  
    const totalPages = Math.max(1, Math.ceil(products.length / ROWS_PER_PAGE));
  
    useEffect(() => {
      if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);
  
    const paginatedItems = useMemo(() => {
      const start = (currentPage - 1) * ROWS_PER_PAGE;
      return products.slice(start, start + ROWS_PER_PAGE);
    }, [products, currentPage]);
  
    const startRow = products.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
    const endRow = Math.min(currentPage * ROWS_PER_PAGE, products.length);
  
    /* =========================================
       DRAWER OPEN / CLOSE
    ========================================= */
  
    const releasePreviews = (images) =>
      images.forEach((image) => URL.revokeObjectURL(image.preview));
  
    const resetForm = () => {
      releasePreviews(newImages);
  
      setEditingId(null);
      setCategoryId("");
      setName("");
      setDescription("");
      setSizes([nextSizeRow([])]);
      setExistingImages([]);
      setNewImages([]);
      setError("");
    };
  
    const openAddDrawer = () => {
      resetForm();
      setDrawerOpen(true);
    };
  
    const openEditDrawer = (product) => {
      releasePreviews(newImages);
  
      setEditingId(product.id);
      setCategoryId(product.category_id ?? "");
      setName(product.name || "");
      setDescription(product.description || "");
      setSizes(
        product.sizes.length > 0
          ? product.sizes.map((s) => ({ size: s.size, price: String(s.price) }))
          : [nextSizeRow([])]
      );
      setExistingImages(product.images || []);
      setNewImages([]);
      setError("");
      setDrawerOpen(true);
    };
  
    const closeDrawer = () => {
      if (saving) return;
  
      resetForm();
      setDrawerOpen(false);
    };
  
    /* =========================================
       SIZE ROWS
    ========================================= */
  
    const addSizeRow = () => {
      if (sizes.length >= MAX_SIZES) return;
      setSizes((previous) => [...previous, nextSizeRow(previous)]);
    };
  
    const updateSizeRow = (index, field, value) => {
      setSizes((previous) =>
        previous.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      );
    };
  
    const removeSizeRow = (index) => {
      setSizes((previous) =>
        previous.length === 1 ? previous : previous.filter((_, i) => i !== index)
      );
    };
  
    /* =========================================
       IMAGES
    ========================================= */
  
    const totalImages = existingImages.length + newImages.length;
  
    const handlePickImages = (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";
  
      const accepted = [];
      let message = "";
  
      for (const file of files) {
        if (totalImages + accepted.length >= MAX_IMAGES) {
          message = `You can upload up to ${MAX_IMAGES} images.`;
          break;
        }
  
        if (!ALLOWED_TYPES.includes(file.type)) {
          message = "Only JPG, PNG or WEBP images are allowed.";
          continue;
        }
  
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
          message = `Each image must be ${MAX_IMAGE_MB}MB or less.`;
          continue;
        }
  
        accepted.push({
          key: `${file.name}-${file.size}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }
  
      setError(message);
      if (accepted.length > 0) setNewImages((previous) => [...previous, ...accepted]);
    };
  
    const removeExistingImage = (imageId) =>
      setExistingImages((previous) => previous.filter((img) => img.id !== imageId));
  
    const removeNewImage = (key) => {
      setNewImages((previous) => {
        const target = previous.find((img) => img.key === key);
        if (target) URL.revokeObjectURL(target.preview);
  
        return previous.filter((img) => img.key !== key);
      });
    };
  
    /* =========================================
       SAVE / UPDATE PRODUCT
    ========================================= */
  
    const handleSubmit = async (event) => {
      event.preventDefault();
  
      if (!categoryId) return setError("Please select a category.");
  
      const productName = name.trim();
      if (!productName) return setError("Please enter product name.");
  
      const productDescription = description.trim();
      if (countWords(productDescription) > MAX_DESCRIPTION_WORDS) {
        return setError(`Description must be ${MAX_DESCRIPTION_WORDS} words or less.`);
      }
  
      /* SIZES */
      const cleanSizes = [];
      const seen = new Set();
  
      for (const row of sizes) {
        const size = row.size.trim();
        const price = Number(row.price);
  
        if (!size) return setError("Please enter a size in every row.");
  
        if (!Number.isFinite(price) || price <= 0) {
          return setError(`Please enter a valid price for size ${size}.`);
        }
  
        if (seen.has(size.toLowerCase())) {
          return setError(`Size ${size} is added twice.`);
        }
  
        seen.add(size.toLowerCase());
        cleanSizes.push({ size, price });
      }
  
      /* FORM DATA (images need multipart) */
      const formData = new FormData();
      formData.append("category_id", categoryId);
      formData.append("name", productName);
      formData.append("description", productDescription);
      formData.append("sizes", JSON.stringify(cleanSizes));
  
      if (editingId) {
        formData.append(
          "keep_image_ids",
          JSON.stringify(existingImages.map((img) => img.id))
        );
      }
  
      newImages.forEach((image) => formData.append("images", image.file));
  
      try {
        setSaving(true);
        setError("");
  
        const response = editingId
          ? await updateProductApi(editingId, formData)
          : await addProductApi(formData);
  
        const savedProduct = response?.data?.data;
  
        if (!savedProduct) {
          await loadProducts();
        } else if (editingId) {
          setProducts((previous) =>
            previous.map((p) => (Number(p.id) === Number(editingId) ? savedProduct : p))
          );
        } else {
          setProducts((previous) => [savedProduct, ...previous]);
          setCurrentPage(1);
        }
  
        resetForm();
        setDrawerOpen(false);
      } catch (err) {
        console.error("Product save error:", err);
  
        setError(
          err?.response?.data?.message ||
            (editingId ? "Unable to update product." : "Unable to add product.")
        );
      } finally {
        setSaving(false);
      }
    };
  
    /* =========================================
       DELETE PRODUCT
    ========================================= */
  
    const handleDelete = async (product) => {
      if (!window.confirm(`Delete "${product.name}"?`)) return;
  
      try {
        setDeletingId(product.id);
        setError("");
  
        await deleteProductApi(product.id);
  
        setProducts((previous) =>
          previous.filter((p) => Number(p.id) !== Number(product.id))
        );
      } catch (err) {
        console.error("Product delete error:", err);
        setError(err?.response?.data?.message || "Unable to delete product.");
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
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Products</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your products.</p>
          </div>
  
          <button
            type="button"
            onClick={openAddDrawer}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#ee027e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a50000] sm:px-5"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
  
        {/* PAGE ERROR */}
        {error && !drawerOpen && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}
  
        {/* PRODUCTS TABLE */}
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className={TH_CLASS}>S.No</th>
                  <th className={TH_CLASS}>Image</th>
                  <th className={TH_CLASS}>Category</th>
                  <th className={TH_CLASS}>Product Name</th>
                  <th className={TH_CLASS}>Sizes &amp; Price</th>
                  <th className={`${TH_CLASS} text-center`}>Action</th>
                </tr>
              </thead>
  
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-16 text-center text-sm font-semibold text-slate-500">
                      Loading products...
                    </td>
                  </tr>
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((product, index) => (
                    <tr key={product.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                      </td>
  
                      <td className="px-5 py-4">
                        {product.images?.length > 0 ? (
                          <div className="relative h-12 w-12">
                            <img
                              src={getImageUrl(product.images[0].path)}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                            />
                            {product.images.length > 1 && (
                              <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-800 px-1.5 text-[10px] font-bold text-white">
                                +{product.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
  
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {product.category_name || "-"}
                      </td>
  
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-800">{product.name}</span>
                        {product.description && (
                          <p className="mt-1 line-clamp-2 max-w-[280px] text-xs text-slate-500">
                            {product.description}
                          </p>
                        )}
                      </td>
  
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex whitespace-nowrap rounded-full bg-[#ee027e]/10 px-3 py-1 text-xs font-bold text-[#ee027e]"
                            >
                              {s.size}: ₹{Number(s.price).toLocaleString("en-IN")}
                            </span>
                          ))}
                        </div>
                      </td>
  
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDrawer(product)}
                            title="Edit"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#ee027e]/30 hover:bg-[#ee027e]/10 hover:text-[#ee027e]"
                          >
                            <Pencil size={16} />
                          </button>
  
                          <button
                            type="button"
                            disabled={deletingId === product.id}
                            onClick={() => handleDelete(product)}
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
                    <td colSpan="6" className="px-5 py-16 text-center">
                      <p className="text-sm font-bold text-slate-800">No products found</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Click Add Product to create your first product.
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
              Showing {startRow} - {endRow} of {products.length}
            </p>
  
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
  
            <div className="absolute right-0 top-0 h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-[440px]">
              {/* HEADER */}
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingId ? "Edit Product" : "Add Product"}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingId ? "Update product details" : "Add a new product"}
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
                {/* CATEGORY */}
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Category</label>
  
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
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
  
                {/* PRODUCT NAME */}
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Product Name</label>
  
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                    className={INPUT_CLASS}
                  />
                </div>
  
                {/* PRODUCT DESCRIPTION */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">
                      Product Description{" "}
                      <span className="font-medium text-slate-400">(optional)</span>
                    </label>
  
                    <span
                      className={`text-xs font-semibold ${
                        descriptionWords >= MAX_DESCRIPTION_WORDS
                          ? "text-[#ee027e]"
                          : "text-slate-400"
                      }`}
                    >
                      {descriptionWords}/{MAX_DESCRIPTION_WORDS} words
                    </span>
                  </div>
  
                  <textarea
                    rows={4}
                    value={description}
                    disabled={saving}
                    onChange={(e) => setDescription(limitWords(e.target.value))}
                    placeholder="Describe the product in up to 100 words"
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#ee027e] focus:ring-2 focus:ring-[#ee027e]/10 disabled:bg-slate-50"
                  />
                </div>
  
                {/* SIZES & PRICE */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Size &amp; Price</label>
  
                    <button
                      type="button"
                      onClick={addSizeRow}
                      disabled={sizes.length >= MAX_SIZES}
                      title="Add size"
                      className="flex h-8 items-center gap-1 rounded-lg bg-[#ee027e]/10 px-3 text-xs font-bold text-[#ee027e] transition hover:bg-[#ee027e]/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={14} />
                      Add size
                    </button>
                  </div>
  
                  <datalist id="size-suggestions">
                    {SIZE_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
  
                  <div className="space-y-3">
                    {sizes.map((row, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          list="size-suggestions"
                          value={row.size}
                          maxLength={20}
                          onChange={(e) => updateSizeRow(index, "size", e.target.value)}
                          placeholder="Size"
                          className={`${INPUT_BASE} w-24 shrink-0 px-3`}
                        />
  
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={row.price}
                          onChange={(e) => updateSizeRow(index, "price", e.target.value)}
                          placeholder="Price"
                          className={`${INPUT_BASE} min-w-0 flex-1 px-3`}
                        />
  
                        <button
                          type="button"
                          onClick={() => removeSizeRow(index)}
                          disabled={sizes.length === 1}
                          title="Remove size"
                          className="flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
  
                {/* IMAGES */}
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Images{" "}
                    <span className="font-medium text-slate-400">
                      ({totalImages}/{MAX_IMAGES})
                    </span>
                  </label>
  
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((image) => (
                      <div key={`saved-${image.id}`} className="relative aspect-square">
                        <img
                          src={getImageUrl(image.path)}
                          alt="Product"
                          className="h-full w-full rounded-xl border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id)}
                          title="Remove image"
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-[#ee027e]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
  
                    {newImages.map((image) => (
                      <div key={image.key} className="relative aspect-square">
                        <img
                          src={image.preview}
                          alt="New upload"
                          className="h-full w-full rounded-xl border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(image.key)}
                          title="Remove image"
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-[#ee027e]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
  
                    {totalImages < MAX_IMAGES && (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-[#ee027e] hover:text-[#ee027e]">
                        <ImagePlus size={22} />
                        <span className="text-xs font-semibold">Add</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handlePickImages}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
  
                  <p className="mt-2 text-xs text-slate-400">
                    JPG, PNG or WEBP. Up to {MAX_IMAGES} images, {MAX_IMAGE_MB}MB each.
                  </p>
                </div>
  
                {/* FORM ERROR */}
                {error && (
                  <div className="mb-5 rounded-lg bg-red-50 px-3 py-3 text-sm font-medium leading-5 text-red-600">
                    {error}
                  </div>
                )}
  
                {/* SAVE BUTTON */}
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
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }