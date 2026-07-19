import React, { useEffect, useState, useRef, useCallback } from "react";
import HeroSection from "@/features/customer/components/HeroSection";
import FeaturesSection from "@/features/customer/components/FeaturesSection";
import FeaturedRestaurants from "@/features/customer/components/FeaturedRestaurants";
import CTASection from "@/features/customer/components/CTASection";
import { useRestaurantStore } from "@/features/customer/store/useRestaurantStore";
import FeaturedCategories from "@/features/customer/components/FeaturedCategory";
import Navbar from "@/features/customer/components/skeleton/Navbar";
import socketService from "@/services/socketService";
import { userAuthStore } from "@/features/customer/store/userAuthStore";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/features/customer/store/notificationStore";

const Home = () => {
  const { restaurants, categories, getrestaurants, loading, getcategories } =
    useRestaurantStore();
  const { authUser: user } = userAuthStore();
  const { notifications, addNotification, clearNotifications } =
    useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef();

  const handleOrderAccepted = useCallback(
    ({ orderId, riderProfile }) => {
      console.log(`Order ${orderId} accepted by rider:`, riderProfile);
      addNotification({ orderId, riderProfile, type: "order_accepted" });
    },
    [addNotification]
  );

  const handleOrderStatusUpdated = useCallback(
    (updatedOrder) => {
      console.log(
        "Customer received order_status_updated event in handler:",
        updatedOrder
      );
      if (updatedOrder.status === "preparing") {
        addNotification({
          orderId: updatedOrder.order_id,
          status: updatedOrder.status,
          type: "order_status_update",
          message: `Restaurant has accepted your order #${updatedOrder.order_id}.`,
        });
      } else if (updatedOrder.status === "restaurant_rejected") {
        addNotification({
          orderId: updatedOrder.order_id,
          status: updatedOrder.status,
          type: "order_status_update",
          message: `Restaurant has rejected your order #${updatedOrder.order_id}.`,
        });
      }
    },
    [addNotification]
  );

  // Effect for fetching initial data (restaurants, categories)
  useEffect(() => {
    getrestaurants();
    getcategories();
  }, []);

  // Effect for managing socket connection and event listeners
  useEffect(() => {
    if (user && user.user_id) {
      console.log(`HomePage: Initializing socket listeners for customer ID: ${user.user_id}`);

      socketService.on("order_accepted", handleOrderAccepted);
      socketService.on("order_status_updated", handleOrderStatusUpdated);

      return () => {
        console.log(
          "HomePage: Cleaning up customer homepage socket listeners."
        );
        socketService.off("order_accepted", handleOrderAccepted);
        socketService.off("order_status_updated", handleOrderStatusUpdated);
      };
    }
  }, [user, handleOrderAccepted, handleOrderStatusUpdated]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => setShowNotifications((v) => !v)}
          className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-10"
        >
          <Bell className="h-6 w-6" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div
            className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in"
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Notifications
              </h3>
            </div>
            {notifications.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="p-4 border-b border-gray-200 last:border-b-0"
                  >
                    {notif.type === "order_accepted" && (
                      <p className="font-medium text-gray-900">
                        Order #{notif.orderId} accepted by{" "}
                        {notif.riderProfile.name} (
                        {notif.riderProfile.phone_number})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-gray-600">No new notifications</p>
            )}
            <div className="p-4 border-t border-gray-200">
              <button
                className="w-full text-blue-600 hover:text-blue-800"
                onClick={() => {
                  clearNotifications();
                  setShowNotifications(false);
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
      <HeroSection />
      <FeaturesSection />

      {loading ? (
        <div className="text-center py-20 text-xl text-gray-500">
          Loading restaurants...
        </div>
      ) : (
        <FeaturedRestaurants restaurants={restaurants} />
      )}

      {/* <FeaturedCategories categories={categories} /> */}
      <CTASection />
    </div>
  );
};

export default Home;
