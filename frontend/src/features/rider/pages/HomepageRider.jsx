/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRiderAuthStore } from "@/features/rider/store/riderAuthStore";
import RiderLayout from "@/features/rider/components/RiderLayout";
import {
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Clock,
  CheckCircle,
  Truck,
  History,
  Settings,
  LogOut,
  Bell,
  MessageCircle,
  Wallet,
  Eye,
  Info,
} from "lucide-react";
import ChatModal from "@/components/ChatModal";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import socketService from "@/services/socketService";
import { useNotificationStore } from "@/features/customer/store/notificationStore";

const HomepageRider = () => {
  const [dashboardData, setDashboardData] = useState({
    availableOrders: [],
    assignedOrders: [],
  });
  const [loading, setLoading] = useState(true);
  // Initialize isAvailable to true by default, it will be updated by fetched data
  const [isAvailable, setIsAvailable] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const notificationRef = useRef();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Display 6 available orders per page
  const availableOrdersRef = useRef(null);

  const { authrider, logout, checkAuthRider } = useRiderAuthStore();
  const {
    notifications: globalNotifications,
    addNotification,
    clearNotifications,
    unreadCount,
    fetchNotifications,
    markAllAsRead,
    hasMore,
    loading: notificationsLoading
  } = useNotificationStore();

  useEffect(() => {
    checkAuthRider(); // Call checkAuthRider once on component mount
  }, []); // Empty dependency array to run only once

  // Effect for fetching initial data
  useEffect(() => {
    const fetchDashboardData = async (lat = null, lon = null) => {
      try {
        const query = (lat && lon) ? `?lat=${lat}&lon=${lon}` : "";
        const res = await axiosInstance.get(`/rider/data/dashboard${query}`);
        setDashboardData(res.data);
        setIsAvailable(res.data.isAvailable);
        console.log(res.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    if (authrider) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchDashboardData(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error("Error getting location for dashboard:", error);
            // Fallback to fetching without live coordinates
            fetchDashboardData();
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        fetchDashboardData();
      }
    }
  }, [authrider]);

  // Fetch DB notifications on mount
  useEffect(() => {
    if (authrider && authrider.user_id) {
      fetchNotifications(0, 10);
    }
  }, [authrider, fetchNotifications]);

  const handleScroll = (e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    // Allow a 1px margin for fractional pixel rounding errors
    const bottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 1;
    if (bottom && hasMore && !notificationsLoading) {
      fetchNotifications(globalNotifications.length, 10);
    }
  };

  // Effect for managing socket connection and event listeners
  useEffect(() => {
    if (authrider) {
      // Connect and join rooms
      socketService.joinRoom("riders");

      // Define event handlers
      const handleNewDelivery = (newOrder) => {
        console.log("Rider received new_delivery event with data:", newOrder);
        toast.success(`New order #${newOrder.order_id} available!`);
        addNotification({
          type: "delivery_status",
          message: `A new delivery (#${newOrder.order_id}) is available from ${newOrder.restaurant_name}.`,
          created_at: new Date().toISOString(),
          is_read: false,
          id: Date.now()
        });
        setDashboardData((prevData) => ({
          ...prevData,
          availableOrders: [newOrder, ...(prevData?.availableOrders || [])],
        }));
      };

      const handleDeliveryRemoved = ({ orderId }) => {
        setDashboardData((prevData) => {
          const orderExists = prevData?.availableOrders?.some(
            (order) => order.order_id === orderId
          );
          
          if (orderExists) {
            toast.info(`Order #${orderId} is no longer available.`);
            return {
              ...prevData,
              availableOrders: prevData.availableOrders.filter(
                (order) => order.order_id !== orderId
              ),
            };
          }
          return prevData;
        });
      };

      // Register event listeners
      socketService.on("new_delivery", handleNewDelivery);
      socketService.on("delivery_removed", handleDeliveryRemoved);

      // Cleanup on component unmount or when authrider changes
      return () => {
        console.log(
          "Cleaning up rider homepage socket listeners."
        );
        socketService.off("new_delivery", handleNewDelivery);
        socketService.off("delivery_removed", handleDeliveryRemoved);
      };
    }
  }, [authrider, addNotification]);

  // Effect for handling clicks outside the notification dropdown
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
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Effect for live order tracking (GPS broadcasting)
  useEffect(() => {
    let watchId;
    // We want to broadcast location if they are available for new orders OR if they are currently delivering
    if (isAvailable || dashboardData?.assignedOrders?.length > 0) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            // 1. Always ping Redis so they stay in the dispatch pool
            if (isAvailable) {
              socketService.emit("update_location", {
                riderId: authrider?.user_id,
                latitude,
                longitude,
              });
            }

            // 2. Also broadcast to any active assigned orders so Customers can track them
            if (dashboardData?.assignedOrders?.length > 0) {
              dashboardData.assignedOrders.forEach((order) => {
                if (order.status !== "delivered") {
                  socketService.emit("update_location", {
                    orderId: order.order_id,
                    riderId: authrider?.user_id,
                    latitude,
                    longitude,
                  });
                }
              });
            }
          },
          (error) => {
            console.error("Error watching location:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000,
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser.");
      }
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [dashboardData?.assignedOrders, isAvailable, authrider]);

  const handleAvailabilityToggle = async () => {
    try {
      const newAvailability = !isAvailable;
      await axiosInstance.put("/rider/data/availability", {
        is_available: newAvailability,
      });
      setIsAvailable(newAvailability);
      toast.success(
        `Availability set to ${newAvailability ? "Available" : "Unavailable"}`
      );
    } catch (err) {
      console.error("Error updating availability:", err);
      toast.error("Failed to update availability.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axiosInstance.put(
        `/rider/data/orders/${orderId}/status`,
        { status: newStatus }
      );
      toast.success("Order status updated successfully!");
      setDashboardData((prevData) => ({
        ...prevData,
        assignedOrders: prevData.assignedOrders
          .filter((order) =>
            order.order_id === orderId ? newStatus !== "delivered" : true
          )
          .map((order) =>
            order.order_id === orderId
              ? { ...order, order_status: newStatus }
              : order
          ),
      }));
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update order status."
      );
    }
  };

  const totalPages = Math.ceil(
    dashboardData.availableOrders.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAvailableOrders = dashboardData.availableOrders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (availableOrdersRef.current) {
      availableOrdersRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
          <div className="flex items-center space-x-3">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <span className="text-xl font-medium text-gray-700">
              Loading dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RiderLayout onChatClick={() => { setSelectedOrderId(null); setIsChatModalOpen(true); }}>
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => { setIsChatModalOpen(false); setSelectedOrderId(null); }}
        currentAuthUser={authrider}
        orderId={selectedOrderId}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-sm border border-white/50 p-8 mb-8 relative z-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Rider Dashboard
              </h1>
              <p className="text-xl text-gray-600 flex items-center font-medium">
                <User className="size-5 mr-2 text-[#e21b70]" />
                Welcome back, {authrider?.name || "Rider"}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="bg-[#e21b70] hover:bg-[#c21760] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Bell className="size-5 mr-2" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto" onScroll={handleScroll}>
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-20">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-[#e21b70]/10 text-[#e21b70] text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className={`text-xs flex items-center gap-1 transition-colors ${unreadCount > 0 ? 'text-gray-600 hover:text-[#e21b70]' : 'text-gray-400 cursor-not-allowed'}`}
                      >
                        <CheckCircle size={14} />
                        Mark as read
                      </button>
                    </div>
                    {globalNotifications.length > 0 ? (
                      <div>
                        {globalNotifications.map((notif, index) => (
                          <div
                            key={notif.id || index}
                            className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors flex items-start gap-3 cursor-pointer ${notif.is_read ? 'bg-white' : 'bg-[#e21b70]/5'}`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-[#e21b70]/10 text-[#e21b70]'}`}>
                              {notif.type === 'new_message' ? <MessageCircle size={16} /> : <Info size={16} />}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                {notif.message}
                              </p>
                              <div className="flex items-center text-xs mt-1.5 font-medium text-gray-500">
                                <Clock size={12} className="mr-1" />
                                {new Date(notif.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            {!notif.is_read && (
                              <div className="w-2 h-2 rounded-full bg-[#e21b70] mt-1.5 shrink-0 shadow-sm shadow-[#e21b70]/50"></div>
                            )}
                          </div>
                        ))}
                        {notificationsLoading && (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Loading...
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="p-4 text-gray-500">No notifications yet</p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleAvailabilityToggle}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center ${
                  isAvailable
                    ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                    : "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full inline-block mr-2 ${
                    isAvailable ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                {isAvailable ? "Available" : "Unavailable"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Assigned Order Section */}
        {dashboardData?.assignedOrders &&
        dashboardData.assignedOrders.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="space-y-8"
          >
            {dashboardData.assignedOrders.map((order, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={order.order_id}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-[#e21b70]/20 p-6 mb-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <Package className="size-5 text-[#e21b70] mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Order #{order.order_id}
                  </h3>
                  <span
                    className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                      order.order_status === "preparing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {order.order_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                  <div>
                    <p>
                      <span className="font-medium">Restaurant:</span>{" "}
                      {order.restaurant_name}
                    </p>
                    <p>
                      <span className="font-medium">Customer:</span>{" "}
                      {order.customer_name}
                    </p>
                    <p>
                      <span className="font-medium">Total:</span>{" "}
                      <span className="text-green-600 font-bold">
                        Tk {order.total_amount}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Drop-off:</span>{" "}
                      {order.dropoff_addr}
                    </p>
                    {order.dropoff_latitude && order.dropoff_longitude && (
                      <a
                        href={`http://maps.google.com/?q=${order.dropoff_latitude},${order.dropoff_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline mt-1"
                      >
                        <MapPin className="size-4 mr-1" />
                        View on Map
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.order_id);
                      setIsChatModalOpen(true);
                    }}
                    className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <MessageCircle className="size-4 mr-2" />
                    Chat with Customer
                  </button>

                  {order.order_status === "out_for_delivery" && (
                    <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                      onClick={() =>
                        handleUpdateOrderStatus(order.order_id, "delivered")
                      }
                    >
                      <CheckCircle className="size-4 mr-2" />
                      Mark as Delivered
                    </button>
                  )}
                  <Link
                    to={`/rider/data/orders/${order.order_id}`}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <Eye className="size-4 mr-2" />
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200 p-8 mb-8"
          >
            <div className="text-center">
              <Package className="size-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No Active Deliveries
              </h2>
              <p className="text-blue-600">
                You are currently not assigned to any delivery.
              </p>
            </div>
          </motion.div>
        )}

        {/* Available Orders Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-sm border border-white/50 p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Package className="size-6 mr-3 text-[#e21b70]" />
            Available Orders
          </h2>

          {dashboardData?.availableOrders &&
          dashboardData.availableOrders.length > 0 ? (
            <div className="space-y-6" ref={availableOrdersRef}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentAvailableOrders.map((order, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    key={order.order_id}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.order_id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mb-4">
                      Tk {order.total_amount}
                    </p>
                    <p className="text-lg font-semibold text-gray-800 mb-4">
                      Delivery Fee: Tk {order.delivery_fee}
                    </p>
                    <div className="space-y-2">
                      {dashboardData?.assignedOrders?.length > 0 ? (
                        <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg flex items-center justify-center text-sm text-center">
                          <CheckCircle className="size-4 mr-2" />
                          You have an active delivery. Complete it to accept new orders.
                        </div>
                      ) : (
                        <button
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          onClick={async () => {
                            try {
                              await axiosInstance.put(
                                `/rider/data/orders/${order.order_id}/accept`
                              );
                              toast.success("Order accepted!");
                              clearNotifications();
                              setShowNotifications(false);
                              setDashboardData((prevData) => ({
                                ...prevData,
                                availableOrders: prevData.availableOrders.filter(
                                  (ao) => ao.order_id !== order.order_id
                                ),
                                assignedOrders: [
                                  ...(prevData.assignedOrders || []),
                                  { ...order, order_status: "out_for_delivery" },
                                ],
                              }));
                            } catch (err) {
                              console.error(
                                "Error accepting order:",
                                err
                              );
                              toast.error(
                                err?.response?.data?.message ||
                                  "Failed to accept order."
                              );
                            }
                          }}
                        >
                          <CheckCircle className="size-5 mr-2" />
                          Accept Order
                        </button>
                      )}
                      <Link
                        to={`/rider/data/orders/${order.order_id}`}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                      >
                        <Package className="size-5 mr-2" />
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-500 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="size-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No available orders at the moment.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Check back later for new delivery opportunities.
              </p>
            </div>
          )}
        </motion.div>

      </div>
    </RiderLayout>
  );
};

export default HomepageRider;
