import axiosClient from "./axiosClient";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

/* =========================================
   PRODUCT APIs  (data is sent as FormData
   because products can include images)
========================================= */

export const getAdminProductsApi = () => axiosClient.get("/products");

export const addProductApi = (formData) =>
  axiosClient.post("/products", formData, multipart);

export const updateProductApi = (id, formData) =>
  axiosClient.put(`/products/${id}`, formData, multipart);

export const deleteProductApi = (id) => axiosClient.delete(`/products/${id}`);

/* Build a full image URL from the saved path (/uploads/products/xyz.jpg) */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//.test(imagePath)) return imagePath;

  const base = String(axiosClient.defaults.baseURL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  return `${base}${imagePath}`;
};