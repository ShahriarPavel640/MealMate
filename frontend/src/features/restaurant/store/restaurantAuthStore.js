import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

export const restaurantAuthStore = create((set, get) => ({
  authRestaurant: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingRestaurant: true,
  isLoggedIn: false,
  socket: null,
  isChangingMenu: false,
  initialMenuItems: [],

  checkAuthRestaurant: async () => {
    try {
      const res = await axiosInstance.get("/restaurant/is-verify");
      set({ authRestaurant: { ...res.data, role: 'restaurant' } });
    } catch (err) {
      console.log("Error in checkAuth", err);
    } finally {
      set({ isCheckingRestaurant: false });
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/restaurant/login", data);
      set({ authRestaurant: { ...res.data, role: 'restaurant' } });
      toast.success("Logged in successfully");
      //console.log(authRestaurant);
      //console.log(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/restaurant/register", data);
      set({ authRestaurant: { ...res.data, role: 'restaurant' } });
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
      await axiosInstance.get("/restaurant/logout");
      set({ authRestaurant: null });
      if (showToast) toast.success("Logged out successfully");
    } catch (err) {
      if (showToast) toast.error(err?.response?.data?.message || "Logout failed");
    } finally {
      set({ isLoggingOut: false });
    }
  },
  add_menu_item: async (data) => {
    try {
      set({ isChangingMenu: true });
      const res = await axiosInstance.post("/restaurant/add_menu", data);
      //toast.success("Menu Item added");
      //await get().get_menus();
      //console.log("new item: ", res.data);

      return res.data.item;
    } catch (err) {
      toast.error(err?.response?.data?.message || "add menu item failed");
    } finally {
      set({ isChangingMenu: false });
    }
  },
  edit_menu_item: async (data, id) => {
    console.log("in edit menu function", id, data);
    try {
      set({ isChangingMenu: true });
      const res = await axiosInstance.put(`/restaurant/edit_menu/${id}`, data);

      //console.log("from backend", res);
      if (res.status === 200) {
        return await get().get_menus();
      }
    } catch (err) {
      //toast.error(err?.response?.data?.message || "failed editing menu");
      return false;
    } finally {
      set({ isChangingMenu: false });
    }
  },
  get_menus: async () => {
    try {
      const res = await axiosInstance.get("/restaurant/get_menu_items");
      //console.log(res.data);
      set({ initialMenuItems: res.data });
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "failed loading menu");
      return [];
    }
  },
  get_categories: async () => {
    try {
      const res = await axiosInstance.get("/restaurant/get_menu_categories");
      console.log("categories :", res.data);
      return res.data;
    } catch (err) {
      console.log("failed loading cateogry");
      return [];
    }
  },
  delete_menu_item: async (id) => {
    try {
      console.log("menu_item_id is in auth restaurant: ", id);
      const res = await axiosInstance.delete(`/restaurant/delete_menu/${id}`);

      if (res.data.status == "success") {
        return await get().get_menus();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "failed deleting menu");
      return false;
    }
  },
}));

