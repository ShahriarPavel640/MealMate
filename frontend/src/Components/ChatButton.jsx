import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";
import socketService from "@/services/socketService";
import { axiosInstance } from "@/lib/axios";
import { userAuthStore } from "@/features/customer/store/userAuthStore";
import toast from "react-hot-toast";

const ChatButton = ({ onClick }) => {
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

      // Don't toast or increment count if the chat modal is currently open
      if (document.body.dataset.chatOpen === "true") return;

      // Increment unread count globally when a new message arrives
      setUnreadCount(prev => prev + 1);
      toast.success(`New message from ${message.sender_name || 'someone'}`);
    };

    socketService.on("receive_message", handleReceiveMessage);

    // Also listen for a custom event we can emit locally when a chat is opened
    // to clear the count, or just poll/refetch when window focuses
    const handleFocus = () => fetchUnreadCount();
    window.addEventListener("focus", handleFocus);

    return () => {
      socketService.off("receive_message", handleReceiveMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentUserId]);

  return (
    <Button
      onClick={() => {
        // Reset locally immediately for snappier UI, backend will be marked read soon
        setUnreadCount(0);
        onClick();
      }}
      className="fixed bottom-24 right-8 md:bottom-8 md:right-8 rounded-full p-4 shadow-lg bg-pink-600 hover:bg-pink-700 text-white z-[60]"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
};

export default ChatButton;
