import axios from "axios";
import { userAuthStore } from "@/features/customer/store/userAuthStore";

export const axiosInstance = axios.create({
  // baseURL: "http://192.168.0.101:5001/api",
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = userAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
