import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { useRestaurantStore } from "./useRestaurantStore";
import { User } from "@/types/models";

// Define the state interface
interface UserAuthState {
  authUser: (User & { role: 'customer' }) | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: unknown[];
  socket: unknown | null;
  checkAuth: () => Promise<void>;
  login: (data: Record<string, unknown>) => Promise<void>;
  signup: (data: Record<string, unknown>) => Promise<void>;
  logout: (showToast?: boolean) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  token?: string;
}

export const userAuthStore = create<UserAuthState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/customer/is-verify");
      set({ authUser: { ...res.data, role: "customer" } });
    } catch (err) {
      console.log("Error in checkAuth", err);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/customer/login", data);
      console.log("logged in user:", res.data);
      set({ authUser: { ...res.data, role: "customer" } });
      console.log("auth user:", get().authUser);
      toast.success("Logged in successfully");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || "something went wrong..");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/customer/register", data);
      set({ authUser: { ...res.data, role: "customer" } });
      toast.success("Signed up successfully");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Sign up failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async (showToast = true) => {
    set({ authUser: null }); // Clear immediately to prevent infinite interceptor loops on 401
    const getrestaurants = useRestaurantStore.getState().getrestaurants;
    const getcategories = useRestaurantStore.getState().getcategories;
    try {
      await axiosInstance.get("/customer/logout");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await getrestaurants();
      await getcategories();
      if (showToast) toast.success("Logged out successfully");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (showToast) toast.error(err.response?.data?.message || "Error logging out");
    }
  },

  updateProfile: async (data) => {
    console.log("data in store", data);
    try {
      const res = await axiosInstance.put("/customer/update_profile", data);
      set({ authUser: res.data });
      toast.success("updated profile successfully");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating profile");
    }
  },
}));
