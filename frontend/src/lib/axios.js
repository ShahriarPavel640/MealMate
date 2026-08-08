import axios from "axios";
import { userAuthStore } from "@/features/customer/store/userAuthStore";

export const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = userAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
