import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { userAuthStore } from "./userAuthStore";

export const useRestaurantStore = create((set, get) => ({
  restaurants: null,
  loading: false,
  categories: [],

  getrestaurants: async (page = 1, limit = 9) => {
    set({ loading: true });
    try {
      const authUser = userAuthStore.getState().authUser;
      let res;

      if (authUser) {
        res = await axiosInstance.get("customer/nearby_restaurants", { params: { page, limit } });
      } else {
        res = await axiosInstance.get("customer/getRestaurants", { params: { page, limit } });
      }
      // console.log("restaurants are: ");
      console.log(res.data);
      set({ restaurants: res.data.data });
      return res.data;
    } catch (err) {
      console.error("Error fetching restaurants", err);
      //toast.error(err?.response?.data?.message || "Failed to load restaurants");
      set({ restaurants: [] });
      return { data: [], pagination: { totalPages: 1 } };
    } finally {
      set({ loading: false });
    }
  },
  searchRestaurantsByName: async (searchTerm, page = 1, limit = 9) => {
    try {
      const res = await axiosInstance.get("/customer/searchRestaurant", {
        params: { name: searchTerm, page, limit },
      });
      set({ restaurants: res.data.data });
      return res.data;
    } catch (err) {
      console.error("Search error:", err);
      return { data: [], pagination: { totalPages: 1 } };
    }
  },
  toggleFavorite: async (restaurantId) => {
    try {
      // Optimistic update
      const currentRestaurants = get().restaurants;
      if (!currentRestaurants) return;

      const targetIndex = currentRestaurants.findIndex(r => r.restaurant_id === restaurantId);
      if (targetIndex === -1) return;

      const wasFavorite = currentRestaurants[targetIndex].is_favorite;
      
      // Update local state temporarily
      const newRestaurants = [...currentRestaurants];
      newRestaurants[targetIndex] = {
        ...newRestaurants[targetIndex],
        is_favorite: !wasFavorite
      };

      // Re-sort so favorites are at the top, then by distance
      newRestaurants.sort((a, b) => {
        if (a.is_favorite === b.is_favorite) {
          return (a.distance || 0) - (b.distance || 0);
        }
        return a.is_favorite ? -1 : 1;
      });

      set({ restaurants: newRestaurants });

      // Call API
      const res = await axiosInstance.post(`/customer/restaurant/${restaurantId}/favorite`);
      
      // Sync with actual backend response if needed
      if (res.data.is_favorite !== !wasFavorite) {
        // If the server disagreed, we should ideally revert, but usually it matches
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("Failed to update favorite status");
      // Could revert the optimistic update here if needed
      get().getrestaurants(); // Re-fetch as a fail-safe
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
