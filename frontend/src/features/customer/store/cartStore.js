import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (item) => set((state) => ({ cartItems: [...state.cartItems, item] })),
      updateQuantity: (menuItemId, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.menu_item_id === menuItemId ? { ...item, quantity } : item
          ),
        })),
      removeFromCart: (cartItemId) => {
        console.log("removeFromCart called with cartItemId:", cartItemId);
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.cart_item_id !== cartItemId),
        }));
      },
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'cart-storage', // name of the item in the storage (must be unique)
    }
  )
);
