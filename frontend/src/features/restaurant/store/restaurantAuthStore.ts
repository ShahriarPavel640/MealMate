import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Restaurant, MenuItem } from "@/types/models";

interface RestaurantAuthState {
  authRestaurant: (Restaurant & { role: 'restaurant' }) | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingRestaurant: boolean;
  isLoggedIn: boolean;
  isLoggingOut?: boolean;
  socket: unknown | null;
  isChangingMenu: boolean;
  initialMenuItems: MenuItem[];
  checkAuthRestaurant: () => Promise<void>;
  login: (data: Record<string, unknown>) => Promise<void>;
  signup: (data: Record<string, unknown>) => Promise<void>;
  logout: (showToast?: boolean) => Promise<void>;
  add_menu_item: (data: Record<string, unknown> | FormData) => Promise<MenuItem | undefined>;
  edit_menu_item: (data: Record<string, unknown> | FormData, id: number) => Promise<MenuItem[] | false>;
  get_menus: () => Promise<MenuItem[]>;
  get_categories: () => Promise<string[]>;
  delete_menu_item: (id: number | string) => Promise<MenuItem[] | false>;
}

export const restaurantAuthStore = create<RestaurantAuthState>((set, get) => ({
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
      const res = await axiosInstance.post("/restaurant/register", data);
      set({ authRestaurant: { ...res.data, role: 'restaurant' } });
      toast.success("Signed up successfully");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async (showToast = true) => {
    set({ isLoggingOut: true, authRestaurant: null });
    try {
      await axiosInstance.get("/restaurant/logout");
      if (showToast) toast.success("Logged out successfully");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      if (showToast) toast.error(apiErr?.response?.data?.message || "Logout failed");
    } finally {
      set({ isLoggingOut: false });
    }
  },
  add_menu_item: async (data) => {
    try {
      set({ isChangingMenu: true });
      const res = await axiosInstance.post("/restaurant/add_menu", data);
      return res.data.item;
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message || "add menu item failed");
    } finally {
      set({ isChangingMenu: false });
    }
  },
  edit_menu_item: async (data, id) => {
    console.log("in edit menu function", id, data);
    try {
      set({ isChangingMenu: true });
      const res = await axiosInstance.put(`/restaurant/edit_menu/${id}`, data);

      if (res.status === 200) {
        return await get().get_menus();
      }
      return false;
    } catch (err) {
      return false;
    } finally {
      set({ isChangingMenu: false });
    }
  },
  get_menus: async () => {
    try {
      const res = await axiosInstance.get("/restaurant/get_menu_items");
      set({ initialMenuItems: res.data });
      return res.data;
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message || "failed loading menu");
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
      return false;
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message || "failed deleting menu");
      return false;
    }
  },
}));
