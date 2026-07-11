import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";

const ChatButton = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-24 right-8 rounded-full p-4 shadow-lg bg-pink-600 hover:bg-pink-700 text-white z-50"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};

export default ChatButton;
