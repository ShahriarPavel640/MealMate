import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Rider } from "@/types/models";

interface RiderAuthState {
  authrider: (Rider & { role: 'rider' }) | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isCheckingAuthRider: boolean;
  isLoggingOut?: boolean;
  checkAuthRider: () => Promise<void>;
  login: (data: Record<string, unknown>) => Promise<void>;
  signup: (data: Record<string, unknown>) => Promise<void>;
  logout: (showToast?: boolean) => Promise<void>;
}

export const useRiderAuthStore = create<RiderAuthState>((set) => ({
  authrider: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuthRider: true,
  isLoggingOut: false,

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
      set({ isCheckingAuthRider: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/rider/login", data);
      set({ authrider: { ...res.data, role: 'rider' } });
      toast.success("Logged in successfully");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message || "Login failed");
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
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async (showToast = true) => {
    set({ isLoggingOut: true, authrider: null });
    try {
      await axiosInstance.post("/rider/logout");
      if (showToast) toast.success("Logged out successfully");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      if (showToast) toast.error(apiErr?.response?.data?.message || "Logout failed");
    } finally {
      set({ isLoggingOut: false });
    }
  },
}));

export const riderAuthStore = useRiderAuthStore;
