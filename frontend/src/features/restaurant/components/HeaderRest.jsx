import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, User, LogOut } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";
import { Input } from "@/features/restaurant/components/ui/input";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import socketService from "@/services/socketService";
import toast from "react-hot-toast";
import { useNotificationStore } from "@/features/customer/store/notificationStore";
import { Link, Navigate, useNavigate } from "react-router-dom";

const HeaderRest = ({ onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, addNotification, clearNotifications } =
    useNotificationStore();
  const menuRef = useRef();
  const notificationRef = useRef();
  const navigate = useNavigate();

  const { logout, authRestaurant } = restaurantAuthStore();

  const handleAcceptOrder = (orderId) => {
    console.log(`Attempting to accept order: ${orderId}`);
    socketService.emit("accept_order", {
      orderId,
      restaurantId: authRestaurant.restaurant_id,
    });
    toast.success(`Order #${orderId} accepted!`);
  };

  const handleRejectOrder = (orderId) => {
    console.log(`Attempting to reject order: ${orderId}`);
    socketService.emit("reject_order", {
      orderId,
      restaurantId: authRestaurant.restaurant_id,
    });
    toast.error(`Order #${orderId} rejected.`);
  };

  useEffect(() => {
    if (authRestaurant && authRestaurant.restaurant_id) {
      socketService.connect(authRestaurant.restaurant_id, "restaurant");

      const handleNewOrder = (newOrder) => {
        console.log("New order notification:", newOrder);
        addNotification(newOrder);
      };

      const handleOrderStatusUpdated = (updatedOrder) => {
        // Optional: Handle order status updates if needed, e.g., remove from a list of pending orders
      };

      const handleOrderAcceptedByRider = ({ orderId, riderProfile }) => {
        console.log(`Order ${orderId} accepted by rider:`, riderProfile);
        addNotification({ orderId, riderProfile, type: "order_accepted" });
        toast.success(`Order #${orderId} accepted by ${riderProfile.name}!`);
      };

      socketService.on("new_order", handleNewOrder);
      socketService.on("order_status_updated", handleOrderStatusUpdated);
      socketService.on("order_accepted", handleOrderAcceptedByRider);

      return () => {
        socketService.off("new_order", handleNewOrder);
        socketService.off("order_status_updated", handleOrderStatusUpdated);
        socketService.off("order_accepted", handleOrderAcceptedByRider);
      };
    }
  }, [authRestaurant, addNotification]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    if (showMenu || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, showNotifications]);

  return (
    <header className="bg-gray-900 border-b border-gray-700 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">Hello, Chef!</h1>
          {/* <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders, menu items..."
              className="pl-10 w-80 bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
            />
          </div> */}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:bg-gray-800"
              onClick={() => setShowNotifications((v) => !v)}
            >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div
              className="absolute right-0 top-12 mt-2 w-80 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 z-50 animate-fade-in"
            >
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">New Orders</h3>
              </div>
              {notifications.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {notifications.map((notif, index) => (
                    <div
                      key={index}
                      className="p-4 border-b border-gray-700 last:border-b-0"
                    >
                      {notif.type === "order_accepted" ? (
                        <p className="font-medium">
                          Order #{notif.orderId} accepted by{" "}
                          {notif.riderProfile.name} (
                          {notif.riderProfile.phone_number})
                        </p>
                      ) : (
                        <>
                          <p className="font-medium">
                            Order #{notif.order_id} from {notif.customer_name}
                          </p>
                          <p className="text-sm text-gray-400">
                            Total: ${notif.total_amount}
                          </p>
                          <p className="text-sm text-gray-400">
                            Status: {notif.status.replace(/_/g, " ")}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              variant="outline"
                              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 h-auto"
                              onClick={() => handleAcceptOrder(notif.order_id)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 h-auto"
                              onClick={() => handleRejectOrder(notif.order_id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-gray-400">No new orders</p>
              )}
              <div className="p-4 border-t border-gray-700">
                <Button
                  variant="link"
                  className="w-full text-blue-400"
                  onClick={() => {
                    clearNotifications();
                    setShowNotifications(false);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
          </div>

          <div className="flex items-center space-x-3 relative" ref={menuRef}>
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {authRestaurant.name}
              </p>
              <p className="text-xs text-gray-400">Premium Partner</p>
            </div>
            <button
              className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-full focus:outline-none"
              onClick={() => setShowMenu((v) => !v)}
              aria-label="User menu"
            >
              <User className="h-5 w-5 text-white" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-12 mt-2 w-40 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 z-50 animate-fade-in">
                <button
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-700 rounded-t-lg"
                  onClick={async () => {
                    setShowMenu(false);
                    await logout();
                    if (onLogout) onLogout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderRest;
