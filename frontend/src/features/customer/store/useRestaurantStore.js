import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { userAuthStore } from "./userAuthStore";

export const useRestaurantStore = create((set, get) => ({
  restaurants: null,
  loading: false,
  categories: [],

  getrestaurants: async () => {
    set({ loading: true });
    try {
      const authUser = userAuthStore.getState().authUser;
      let res;

      if (authUser) {
        res = await axiosInstance.get("customer/nearby_restaurants");
      } else {
        res = await axiosInstance.get("customer/getRestaurants");
      }
      // console.log("restaurants are: ");
      console.log(res.data);
      set({ restaurants: res.data });
    } catch (err) {
      console.error("Error fetching restaurants", err);
      //toast.error(err?.response?.data?.message || "Failed to load restaurants");
      set({ restaurants: [] });
    } finally {
      set({ loading: false });
    }
  },
  searchRestaurantsByName: async (searchTerm) => {
    try {
      const res = await axiosInstance.get("/customer/searchRestaurant", {
        params: { name: searchTerm },
      });
      set({ restaurants: res.data });
      return res.data;
    } catch (err) {
      console.error("Search error:", err);
      return [];
    }
  },
  getcategories: async () => {
    try {
      const res = await axiosInstance.get("customer/getCategories");
      console.log("categories are: ", res.data);
      set({ categories: res.data });
    } catch (err) {
      console.error("Error fetching categories", err);
      toast.error(err?.response?.data?.message || "Failed to load categories");
      set({ categories: [] });
    }
  },
}));
