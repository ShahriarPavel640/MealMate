import React, { useState, useRef, useEffect } from "react";
import { Bell, User, LogOut, Info, Clock, Check } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import socketService from "@/services/socketService";
import toast from "react-hot-toast";
import { useNotificationStore } from "@/features/customer/store/notificationStore";

interface HeaderRestProps {
  onLogout?: () => void;
}

const HeaderRest: React.FC<HeaderRestProps> = ({ onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { 
    notifications, 
    addNotification, 
    unreadCount, 
    fetchNotifications, 
    markAllAsRead, 
    hasMore, 
    loading 
  } = useNotificationStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { logout, authRestaurant } = restaurantAuthStore();

  useEffect(() => {
    if (authRestaurant && authRestaurant.restaurant_id) {
      fetchNotifications(0, 10);
    }
  }, [authRestaurant, fetchNotifications]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
    if (Math.abs(scrollHeight - scrollTop - clientHeight) <= 1 && hasMore && !loading) {
      fetchNotifications(notifications.length, 10);
    }
  };

  useEffect(() => {
    if (authRestaurant && authRestaurant.restaurant_id) {
      const handleNewOrder = (newOrder: { order_id: number | string }) => {
        console.log("New order notification:", newOrder);
        addNotification({
          type: "new_order",
          message: `You have a new order (#${newOrder.order_id}) from a customer.`,
          created_at: new Date().toISOString(),
        });
      };

      const handleOrderAcceptedByRider = ({
        orderId,
        riderProfile,
      }: {
        orderId: number | string;
        riderProfile: { name: string; phone_number: string };
      }) => {
        console.log(`Order ${orderId} accepted by rider:`, riderProfile);
        addNotification({ 
          type: "order_accepted",
          message: `Order #${orderId} accepted by rider ${riderProfile.name} (${riderProfile.phone_number})`,
          created_at: new Date().toISOString(),
        });
        toast.success(`Order #${orderId} accepted by ${riderProfile.name}!`);
      };

      socketService.on("new_order", handleNewOrder);
      socketService.on("order_accepted", handleOrderAcceptedByRider);

      return () => {
        socketService.off("new_order", handleNewOrder);
        socketService.off("order_accepted", handleOrderAcceptedByRider);
      };
    }
  }, [authRestaurant, addNotification]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
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
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div
                className="absolute right-0 top-14 mt-2 w-80 sm:w-96 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 z-50 transform transition-all origin-top-right animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className={`text-xs flex items-center gap-1 transition-colors ${unreadCount > 0 ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 cursor-not-allowed'}`}
                  >
                    <Check size={14} />
                    Mark as read
                  </button>
                </div>
                {notifications.length > 0 ? (
                  <div 
                    className="max-h-60 overflow-y-auto"
                    onScroll={handleScroll}
                  >
                    {notifications.map((notif, index) => (
                      <div
                        key={index}
                        className={`p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800 transition-colors flex items-start gap-3 cursor-pointer ${notif.is_read ? 'bg-gray-900' : 'bg-purple-900/10'}`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${notif.is_read ? 'bg-gray-800 text-gray-500' : 'bg-purple-500/20 text-purple-400'}`}>
                          <Info size={16} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-gray-400' : 'text-gray-100 font-semibold'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center text-xs mt-1.5 font-medium text-gray-500">
                            <Clock size={12} className="mr-1" />
                            {new Date(notif.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-sm shadow-purple-500/50"></div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Loading...
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="p-4 text-gray-400">No notifications yet</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 relative" ref={menuRef}>
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {authRestaurant?.name}
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
