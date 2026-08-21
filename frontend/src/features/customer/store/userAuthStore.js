/* eslint-disable */
import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { data } from "react-router-dom";
import { useRestaurantStore } from "./useRestaurantStore";

export const userAuthStore = create((set, get) => ({
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
    } catch (err) {
      toast.error(err.response.data.message || "something went wrong..");
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
    } catch (err) {
      toast.error(err.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },
  logout: async (data) => {
    set({ isLoggingOut: true });
    const getrestaurants = useRestaurantStore.getState().getrestaurants;
    const getcategories = useRestaurantStore.getState().getcategories;
    try {
      await axiosInstance.get("/customer/logout");
      set({ authUser: null });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await getrestaurants();
      await getcategories();
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error(err.response.data.message);
    }
  },
  updateProfile: async (data) => {
    console.log("data in store", data);
    try {
      const res = await axiosInstance.put("/customer/update_profile", data);
      set({ authUser: res.data });
      toast.success("updated profile successfully");
    } catch (err) {
      toast.error(err.response.data.message);
    }
  },
}));
