import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

export const useRiderAuthStore = create((set) => ({
  authrider: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,

  checkAuthRider: async () => {
    try {
      const res = await axiosInstance.get("/rider/is-verify");
      set((state) => {
        if (JSON.stringify(state.authrider) !== JSON.stringify({ ...res.data, role: 'rider' })) {
          return { authrider: { ...res.data, role: 'rider' } };
        }
        return {};
      });
    } catch (err) {
      console.log("Error in checkAuthRider", err);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/rider/login", data);
      set({ authrider: { ...res.data, role: 'rider' } });
      toast.success("Logged in successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/rider/signup", data);
      set({ authrider: { ...res.data, role: 'rider' } });
      toast.success("Signed up successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async (showToast = true) => {
    set({ isLoggingOut: true });
    try {
      await axiosInstance.post("/rider/logout");
      set({ authrider: null });
      if (showToast) toast.success("Logged out successfully");
    } catch (err) {
      if (showToast) toast.error(err?.response?.data?.message || "Logout failed");
    } finally {
      set({ isLoggingOut: false });
    }
  },
}));

