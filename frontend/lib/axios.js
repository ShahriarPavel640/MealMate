import axios from "axios";
import { userAuthStore } from "../src/store/userAuthStore";

const apiBase = import.meta.env.VITE_API_URL || "";

export const axiosInstance = axios.create({
  baseURL: apiBase ? `${apiBase}/api` : "/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = userAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
