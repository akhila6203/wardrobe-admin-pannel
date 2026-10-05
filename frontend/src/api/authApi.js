import axiosClient from "./axiosClient";


/* =========================================
   ADMIN LOGIN
========================================= */

export const adminLoginApi = (data) => {
  return axiosClient.post(
    "/auth/login",
    data
  );
};


/* =========================================
   ADMIN LOGOUT
========================================= */

export const adminLogoutApi = () => {
  return axiosClient.post(
    "/auth/logout"
  );
};