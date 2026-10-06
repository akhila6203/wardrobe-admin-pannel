import axiosClient from "./axiosClient";

export const getSettingsApi =
  async () => {
    const response =
      await axiosClient.get(
        "/settings"
      );

    return response.data;
  };

export const saveRazorpayApi =
  async (payload) => {
    const response =
      await axiosClient.put(
        "/settings/razorpay",
        payload
      );

    return response.data;
  };

export const testRazorpayApi =
  async () => {
    const response =
      await axiosClient.post(
        "/settings/razorpay/test"
      );

    return response.data;
  };

export const saveShiprocketApi =
  async (payload) => {
    const response =
      await axiosClient.put(
        "/settings/shiprocket",
        payload
      );

    return response.data;
  };

export const testShiprocketApi =
  async () => {
    const response =
      await axiosClient.post(
        "/settings/shiprocket/test"
      );

    return response.data;
  };