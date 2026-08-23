import axios from "axios";
import { userAuthStore } from "@/features/customer/store/userAuthStore";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import { useRiderAuthStore } from "@/features/rider/store/riderAuthStore";

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

// Response Interceptor for handling 401s and Refresh Token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401, we haven't retried yet, and it's not the refresh endpoint failing
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true; // Prevent infinite loops

      try {
        // Attempt to refresh the token using the HttpOnly refresh token cookie
        await axiosInstance.post("/auth/refresh");

        // If successful, retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g., refresh token is expired or invalid), log the user out
        console.error("Refresh token failed, logging out.");
        
        // Ensure we only call logout if it's available in the store
                if (userAuthStore.getState().authUser) userAuthStore.getState().logout(false);
        if (restaurantAuthStore.getState().authRestaurant) restaurantAuthStore.getState().logout(false);
        if (useRiderAuthStore.getState().authrider) useRiderAuthStore.getState().logout(false);
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


