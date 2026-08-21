/* eslint-disable */
import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";
import socketService from "@/services/socketService";
import { axiosInstance } from "@/lib/axios";
import { userAuthStore } from "@/features/customer/store/userAuthStore";
import { useChatStore } from "@/features/customer/store/chatStore";
import toast from "react-hot-toast";

const ChatButton = ({ onClick, isChatOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { authUser } = userAuthStore();
  const currentUserId = authUser?.user_id || authUser?.id;

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosInstance.get('/chat/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching unread chat count:", err);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    fetchUnreadCount();

    const handleReceiveMessage = (message) => {
      // Don't toast or increment count if the message was sent by ourselves
      if (Number(message.sender_id) === Number(currentUserId)) return;

      const incomingOrderId = String(message.chat_order_id || message.order_id);
      if (document.body.dataset.openChatOrderId === incomingOrderId) {
        // We are currently looking at this specific chat. Do not toast or increment badge!
        return;
      }

      setUnreadCount(prev => prev + 1);
      toast.success(`New message from ${message.sender_name || 'someone'}`);
    };

    // When a chat is marked as read (e.g. user opens a conversation), refetch the count
    const handleChatReadUpdate = () => fetchUnreadCount();

    socketService.on("receive_message", handleReceiveMessage);
    window.addEventListener("chatReadUpdate", handleChatReadUpdate);

    return () => {
      socketService.off("receive_message", handleReceiveMessage);
      window.removeEventListener("chatReadUpdate", handleChatReadUpdate);
    };
  }, [currentUserId]);

  return (
    <button
      onClick={() => {
        setUnreadCount(0);
        useChatStore.getState().openChat();
      }}
      className="relative p-2 text-white hover:text-gray-200 transition bg-transparent border-0"
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && !isChatOpen && (
        <span className="absolute top-0 right-0 bg-[#e21b70] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatButton;
