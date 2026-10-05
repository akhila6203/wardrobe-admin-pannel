import axiosClient from "./axiosClient";

// add / update now send FormData (name + optional image file)
const multipart = { headers: { "Content-Type": "multipart/form-data" } };

export const getCategoriesApi = () => axiosClient.get("/categories");

export const addCategoryApi = (formData) =>
  axiosClient.post("/categories", formData, multipart);

export const updateCategoryApi = (id, formData) =>
  axiosClient.put(`/categories/${id}`, formData, multipart);

export const deleteCategoryApi = (id) => axiosClient.delete(`/categories/${id}`);