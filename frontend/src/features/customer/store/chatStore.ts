import { create } from "zustand";

interface ChatState {
  isChatOpen: boolean;
  chatOrderId: number | string | null;
  openChat: (orderId?: number | string | null) => void;
  closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isChatOpen: false,
  chatOrderId: null,
  openChat: (orderId = null) => set({ isChatOpen: true, chatOrderId: orderId }),
  closeChat: () => set({ isChatOpen: false, chatOrderId: null }),
}));
