import axiosClient from "./axiosClient";


export const getAdminMenuApi =
  () =>
    axiosClient.get(
      "/menu/admin"
    );


export const getPortionsApi =
  () =>
    axiosClient.get(
      "/menu/portions"
    );


export const addMenuApi =
  (data) =>
    axiosClient.post(
      "/menu",
      data
    );


export const updateMenuApi =
  (id, data) =>
    axiosClient.put(
      `/menu/${id}`,
      data
    );


export const deleteMenuApi =
  (id) =>
    axiosClient.delete(
      `/menu/${id}`
    );