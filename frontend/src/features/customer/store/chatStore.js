import { create } from "zustand";

export const useChatStore = create((set) => ({
  isChatOpen: false,
  chatOrderId: null,
  openChat: (orderId = null) => set({ isChatOpen: true, chatOrderId: orderId }),
  closeChat: () => set({ isChatOpen: false, chatOrderId: null }),
}));
