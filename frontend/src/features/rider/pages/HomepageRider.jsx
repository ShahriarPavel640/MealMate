import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useRiderAuthStore } from "@/features/rider/store/riderAuthStore";
import Navbar from "@/features/customer/components/skeleton/Navbar";
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
  const notificationRef = useRef();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Display 6 available orders per page
  const availableOrdersRef = useRef(null);

  const { authrider, logout, checkAuthRider } = useRiderAuthStore();
  const {
    notifications: globalNotifications,
    addNotification,
    clearNotifications,
  } = useNotificationStore();

  useEffect(() => {
    checkAuthRider(); // Call checkAuthRider once on component mount
  }, []); // Empty dependency array to run only once

  // Effect for fetching initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axiosInstance.get("/rider/data/dashboard");
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
      fetchDashboardData();
    }
  }, [authrider]);

  // Effect for managing socket connection and event listeners
  useEffect(() => {
    if (authrider) {
      // Connect and join rooms
      socketService.joinRoom("riders");

      // Define event handlers
      const handleNewDelivery = (newOrder) => {
        console.log("Rider received new_delivery event with data:", newOrder);
        toast.success(`New order #${newOrder.order_id} available!`);
        addNotification(newOrder);
        setDashboardData((prevData) => ({
          ...prevData,
          availableOrders: [newOrder, ...(prevData?.availableOrders || [])],
        }));
      };

      const handleOrderAcceptedByOtherRider = ({ orderId, riderId }) => {
        if (authrider.user_id !== riderId) {
          toast.info(`Order #${orderId} was accepted by another rider.`);
          setDashboardData((prevData) => ({
            ...prevData,
            availableOrders: prevData.availableOrders.filter(
              (order) => order.order_id !== orderId
            ),
          }));
        }
      };

      // Register event listeners
      socketService.on("new_delivery", handleNewDelivery);
      socketService.on("order_accepted", handleOrderAcceptedByOtherRider);

      // Cleanup on component unmount or when authrider changes
      return () => {
        console.log(
          "Cleaning up rider homepage socket listeners."
        );
        socketService.off("new_delivery", handleNewDelivery);
        socketService.off("order_accepted", handleOrderAcceptedByOtherRider);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentAuthUser={authrider}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Rider Dashboard
              </h1>
              <p className="text-xl text-gray-600 flex items-center">
                <User className="size-5 mr-2 text-blue-600" />
                Welcome back, {authrider?.name || "Rider"}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <Bell className="size-5 mr-2" />
                  Notifications
                  {globalNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {globalNotifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-10 max-h-96 overflow-y-auto">
                    {globalNotifications.length > 0 ? (
                      <div>
                        {globalNotifications.map((order) => (
                          <div
                            key={order.order_id}
                            className="p-4 border-b border-gray-200 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">
                              New Order #{order.order_id} from{" "}
                              {order.restaurant_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Total: Tk {order.total_amount}
                            </p>
                            <p className="text-sm text-gray-600">
                              Drop-off: {order.dropoff_addr}
                            </p>
                            <button
                              className="mt-2 w-full bg-green-600
                              hover:bg-green-700 text-white font-semibold py-2
                              px-4 rounded-lg transition-colors duration-200
                              text-sm"
                              onClick={async () => {
                                try {
                                  await axiosInstance.put(
                                    `/rider/data/orders/${order.order_id}/accept`
                                  );
                                  toast.success("Order accepted!");
                                  clearNotifications(); // Clear all notifications after accepting one
                                  // Optimistically remove the order from available orders and add to assigned
                                  setDashboardData((prevData) => ({
                                    ...prevData,
                                    availableOrders:
                                      prevData.availableOrders.filter(
                                        (ao) => ao.order_id !== order.order_id
                                      ),
                                    assignedOrder: order, // Assuming the accepted order becomes the assigned one
                                  }));
                                  setShowNotifications(false); // Close notifications after accepting
                                } catch (err) {
                                  console.error(
                                    "Error accepting order from notification:",
                                    err
                                  );
                                  toast.error(
                                    err?.response?.data?.message ||
                                      "Failed to accept order."
                                  );
                                }
                              }}
                            >
                              Accept Order
                            </button>
                          </div>
                        ))}
                        <div className="p-4 border-t border-gray-200">
                          <button
                            className="w-full text-blue-600 hover:text-blue-800"
                            onClick={clearNotifications}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="p-4 text-gray-600">No new deliveries</p>
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
        </div>

        {/* Assigned Order Section */}
        {dashboardData?.assignedOrders &&
        dashboardData.assignedOrders.length > 0 ? (
          <div className="space-y-8">
            {dashboardData.assignedOrders.map((order) => (
              <div
                key={order.order_id}
                className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl shadow-lg border border-amber-200 p-6 mb-4"
              >
                <div className="flex items-center mb-4">
                  <Package className="size-5 text-amber-600 mr-2" />
                  <h3 className="text-xl font-bold text-amber-800">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-8 mb-8">
            <div className="text-center">
              <Package className="size-16 text-blue-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                No Active Deliveries
              </h2>
              <p className="text-blue-600">
                You are currently not assigned to any delivery.
              </p>
            </div>
          </div>
        )}

        {/* Available Orders Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Package className="size-6 mr-3 text-green-600" />
            Available Orders
          </h2>

          {dashboardData?.availableOrders &&
          dashboardData.availableOrders.length > 0 ? (
            <div className="space-y-6" ref={availableOrdersRef}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentAvailableOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
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
                  </div>
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
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setIsChatModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            <MessageCircle className="size-5 mr-2" />
            Chats
          </button>
          <Link
            to="/rider/history"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            <History className="size-5 mr-2" />
            View Delivery History
          </Link>
          <Link
            to="/rider/earnings"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            <Wallet className="size-5 mr-2" />
            View Performance
          </Link>
          <Link
            to="/rider/data/profile"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            <Settings className="size-5 mr-2" />
            View Profile
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            <LogOut className="size-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomepageRider;
