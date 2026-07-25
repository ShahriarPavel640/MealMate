import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/features/restaurant/components/ui/dialog";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/features/restaurant/components/ui/button";
import { Input } from "@/features/restaurant/components/ui/input";
import socketService from "@/services/socketService";

const ChatModal = ({ isOpen, onClose, orderId, currentAuthUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [currentChatOrderId, setCurrentChatOrderId] = useState(orderId);
  const [currentChatParticipantName, setCurrentChatParticipantName] =
    useState("");
  const messagesEndRef = useRef(null);
  // Track which orderId is currently open so socket handlers can reference it
  const currentChatOrderIdRef = useRef(currentChatOrderId);

  const currentUserId =
    currentAuthUser?.user_id || currentAuthUser?.restaurant_id;
  const currentUserRole =
    currentAuthUser?.role ||
    (currentAuthUser?.restaurant_id ? "restaurant" : "customer");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setCurrentChatOrderId(orderId);
    if (!orderId) {
      setCurrentChatParticipantName("");
    }
  }, [orderId]);

  // Keep ref in sync with state
  useEffect(() => {
    currentChatOrderIdRef.current = currentChatOrderId;
    if (isOpen && currentChatOrderId) {
      document.body.dataset.openChatOrderId = currentChatOrderId;
    } else {
      delete document.body.dataset.openChatOrderId;
    }
  }, [isOpen, currentChatOrderId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      delete document.body.dataset.openChatOrderId;
    };
  }, []);

  // Dispatch chatReadUpdate to notify ChatButton/RiderLayout to refetch unread count
  const dispatchChatReadUpdate = () => {
    window.dispatchEvent(new CustomEvent("chatReadUpdate"));
  };

  const handleReceiveMessage = useCallback((message) => {
    const openOrderId = currentChatOrderIdRef.current;

    // If a specific chat is open and the message belongs to it, add it to the view
    if (openOrderId && String(message.chat_order_id || message.order_id) === String(openOrderId)) {
      setMessages((prevMessages) => [...prevMessages, message]);

      // If the message is not from us, mark it as read immediately since we're looking at it
      if (Number(message.sender_id) !== Number(currentUserId)) {
        axiosInstance.put(`/chat/${openOrderId}/read`).then(() => {
          dispatchChatReadUpdate();
        }).catch(console.error);
      }
    } else if (!openOrderId) {
      // We're on the conversation list view — update the per-conversation unread count
      if (Number(message.sender_id) !== Number(currentUserId)) {
        setConversations(prev => prev.map(convo => {
          if (String(convo.order_id) === String(message.chat_order_id || message.order_id)) {
            return { ...convo, unread_count: (parseInt(convo.unread_count) || 0) + 1 };
          }
          return convo;
        }));
      }
    }
  }, [currentUserId]);

  // Fetch data when modal opens or conversation changes
  useEffect(() => {
    if (isOpen && currentAuthUser) {
      if (currentChatOrderId) {
        axiosInstance
          .get(`/chat/${currentChatOrderId}`)
          .then((res) => {
            setMessages(res.data.messages);
            setCurrentChatParticipantName(res.data.otherParticipantName);
            // Dispatch event after the backend successfully marks it as read
            dispatchChatReadUpdate();
          })
          .catch((error) => {
            console.error("Error fetching chat messages:", error);
            setMessages([]);
            setCurrentChatParticipantName("");
          });

        // Join the order room for real-time messages
        if (socketService.socket && socketService.socket.connected) {
          socketService.emit("join_room", currentChatOrderId);
        }
      } else {
        // Fetch conversation list
        axiosInstance
          .get("/chat")
          .then((res) => {
            setConversations(res.data);
          })
          .catch((error) => {
            console.error("Error fetching conversations:", error);
            setConversations([]);
          });
      }
    }

    return () => {
      if (currentChatOrderId && currentAuthUser) {
        if (socketService.socket && socketService.socket.connected) {
          socketService.emit("leave_room", currentChatOrderId);
        }
      }
    };
  }, [
    isOpen,
    currentChatOrderId,
    currentAuthUser,
    currentUserId,
    currentUserRole,
  ]);

  // Socket listener management
  useEffect(() => {
    if (isOpen) {
      socketService.on("receive_message", handleReceiveMessage);
    }

    return () => {
      socketService.off("receive_message", handleReceiveMessage);
    };
  }, [isOpen, handleReceiveMessage]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentChatOrderId) return;

    try {
      await axiosInstance.post(`/chat/${currentChatOrderId}`, {
        message: newMessage,
      });
      setNewMessage("");
      // Do NOT reload messages here! Let the socket event update the UI.
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleConversationClick = (convo) => {
    setCurrentChatOrderId(convo.order_id);
    setCurrentChatParticipantName(convo.participant_name);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[650px] p-0 flex flex-col z-50 bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          {currentChatOrderId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentChatOrderId(null);
                setCurrentChatParticipantName("");
              }}
              className="flex items-center gap-2 hover:bg-white/80 text-gray-700 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg px-3 py-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-medium">Back</span>
            </Button>
          )}
          <div className="flex-grow text-center">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {currentChatOrderId ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Chat Active
                  </span>
                </div>
              ) : (
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Messages
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2 font-medium">
              {currentChatOrderId ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-gray-700">
                    {currentChatParticipantName ||
                      `Order #${currentChatOrderId}`}
                  </span>
                </span>
              ) : (
                <span className="text-gray-600">Your conversations</span>
              )}
            </DialogDescription>
          </div>
          <div className="w-20"></div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-50">
          {currentChatOrderId ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      No messages yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const isCurrentUser =
                        String(msg.sender_id) === String(currentUserId) &&
                        String(msg.sender_role) === String(currentUserRole);

                      return (
                        <div
                          key={`${msg.message_id}_${index}`}
                          className={`flex items-start space-x-3 ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isCurrentUser && (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md border-2 border-white">
                              {msg.sender_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}

                          <div className={`max-w-xs sm:max-w-md lg:max-w-lg`}>
                            <div
                              className={`px-5 py-3 rounded-2xl shadow-md border ${
                                isCurrentUser
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-200"
                                  : "bg-white text-gray-800 border-gray-200 shadow-sm"
                              }`}
                            >
                              <div
                                className={`flex items-center gap-2 mb-2 ${
                                  isCurrentUser
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <span
                                  className={`text-xs font-semibold ${
                                    isCurrentUser
                                      ? "text-indigo-100"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {msg.sender_name}
                                </span>
                                <span
                                  className={`text-xs font-medium ${
                                    isCurrentUser
                                      ? "text-indigo-200"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {msg.sent_at
                                    ? new Date(msg.sent_at).toLocaleTimeString(
                                        [],
                                        { hour: "2-digit", minute: "2-digit" }
                                      )
                                    : ""}
                                </span>
                              </div>
                              <p
                                className={`text-sm leading-relaxed font-medium ${
                                  isCurrentUser ? "text-white" : "text-gray-800"
                                }`}
                              >
                                {msg.message}
                              </p>
                            </div>

                            {isCurrentUser && (
                              <div className="flex justify-end mt-2 pr-2">
                                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-emerald-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>

                          {isCurrentUser && (
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md border-2 border-white mt-1">
                              {msg.sender_name?.charAt(0)?.toUpperCase() || "Y"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 bg-white p-6 shadow-lg">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full pr-28 py-4 text-base resize-none border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl text-gray-800 placeholder-gray-500 transition-all duration-200 outline-none shadow-sm bg-gray-50 focus:bg-white"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">
                      Press Enter
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-gray-700 mb-3">
                    No conversations yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Your chat history will appear here
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-3">
                  {conversations.map((convo) => (
                    <div
                      key={convo.chat_id}
                      className={`p-5 border-2 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md ${
                        parseInt(convo.unread_count) > 0
                          ? "border-indigo-300 bg-indigo-50/30"
                          : "border-gray-200 bg-white"
                      }`}
                      onClick={() => handleConversationClick(convo)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {convo.participant_name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            {parseInt(convo.unread_count) > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                                {parseInt(convo.unread_count) > 9 ? '9+' : convo.unread_count}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">
                              {convo.participant_name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1 font-medium">
                              <svg
                                className="w-4 h-4 text-indigo-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Order #{convo.order_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {parseInt(convo.unread_count) > 0 && (
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                              {convo.unread_count} new
                            </span>
                          )}
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-indigo-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default ChatModal;
