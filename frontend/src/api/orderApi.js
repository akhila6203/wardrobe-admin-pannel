import axiosClient from "./axiosClient";

/* =========================================
   GET PAID ORDERS
========================================= */

export const getOrdersApi = () => {
  return axiosClient.get(
    "/orders"
  );
};