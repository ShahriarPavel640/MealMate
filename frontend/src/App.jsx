import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Loader } from "lucide-react";

import { userAuthStore } from "@/features/customer/store/userAuthStore";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import { useRiderAuthStore } from "@/features/rider/store/riderAuthStore";

import HomePage from "@/features/customer/pages/HomePage";
import LoginPage from "@/features/customer/pages/LoginPage";
import SignupPage from "@/features/customer/pages/SignupPage";
import ProfilePage from "@/features/customer/pages/ProfilePage";
import RestaurantPage from "@/features/customer/pages/RestaurantPage";
import SignupPageRest from "@/features/restaurant/pages/SignupPageRest";
import LoginPageRider from "@/features/rider/pages/LoginPageRider";
import SignupPageRider from "@/features/rider/pages/SignupPageRider";
import HomepageRider from "@/features/rider/pages/HomepageRider";
import DeliveryHistoryPage from "@/features/rider/pages/DeliveryHistoryPage";
import OrderDetailsPage from "@/features/rider/pages/OrderDetailsPage";
import ProfilePageRider from "@/features/rider/pages/ProfilePageRider";
import EarningsPage from "@/features/rider/pages/EarningsPage";

import OrderHistoryPage from "@/features/customer/pages/OrderHistoryPage";

import Navbar from "@/features/customer/components/skeleton/Navbar";
import HomepageRest from "@/features/restaurant/pages/HomepageRest";
import RestaurantProfie from "@/features/customer/pages/RestaurantProfile";
import RestaurantReviewsPage from "@/features/customer/pages/RestaurantReviewsPage";
import CheckoutPage from "@/features/customer/pages/CheckoutPage";
import SimulatePaymentGateway from "@/features/customer/pages/SimulatePaymentGateway";
import PaymentSuccessPage from "@/features/customer/pages/PaymentSuccessPage";
import PaymentFailedPage from "@/features/customer/pages/PaymentFailedPage";
import PaymentCancelledPage from "@/features/customer/pages/PaymentCancelledPage";
import { Toaster } from "@/features/restaurant/components/ui/toaster";

import ChatButton from "@/Components/ChatButton";
import ChatModal from "@/Components/ChatModal";

import socketService from "@/services/socketService";
import { useNotificationStore } from "@/features/customer/store/notificationStore";

import { useChatStore } from "@/features/customer/store/chatStore";

const ChatPage = () => {
  const { orderId } = useParams();
  const openChat = useChatStore((state) => state.openChat);
  useEffect(() => {
    openChat(orderId);
  }, [orderId, openChat]);
  return <Navigate to="/order-history" />; // Redirect back to order history
};

function App() {
  const { authUser, checkAuth, isCheckingAuth } = userAuthStore();
  const { authRestaurant, checkAuthRestaurant, isCheckingRestaurant } =
    restaurantAuthStore();
  const { authrider, checkAuthRider, isCheckingAuthRider } =
    useRiderAuthStore();
  const { addNotification } = useNotificationStore();
  const { isChatOpen, chatOrderId, closeChat } = useChatStore();

  // Derive current user ID and type for stable socket connection dependencies
  const currentAuthUser = authUser || authRestaurant || authrider;
  const currentUserId =
    currentAuthUser?.user_id || currentAuthUser?.restaurant_id;
  const currentUserType =
    currentAuthUser?.role ||
    (currentAuthUser?.restaurant_id ? "restaurant" : undefined);

  useEffect(() => {
    checkAuth();
    checkAuthRestaurant();
    checkAuthRider();
  }, [checkAuth, checkAuthRestaurant, checkAuthRider]);

  useEffect(() => {
    if (currentUserId && currentUserType) {
      console.log(
        `App.jsx: Attempting to connect socket for ${currentUserType} with ID ${currentUserId}`
      );
      socketService.connect(currentUserId, currentUserType);
    } else {
      console.log(
        "App.jsx: No authenticated user found, disconnecting socket if connected."
      );
      socketService.disconnect();
    }

    return () => {
      console.log("App.jsx: Cleaning up socket connection.");
      socketService.disconnect();
    };
  }, [currentUserId, currentUserType]);

  // Global socket listeners for the customer
  useEffect(() => {
    if (currentUserType === "customer") {
      const handleOrderAccepted = ({ orderId, riderProfile }) => {
        addNotification({ 
          type: "order_accepted",
          message: `Your order #${orderId} has been accepted by rider ${riderProfile.name} (${riderProfile.phone_number}).`
        });
      };

      const handleOrderStatusUpdated = (updatedOrder) => {
        let notificationMessage = `Your order #${updatedOrder.order_id} status has been updated to ${updatedOrder.status}.`;
        switch(updatedOrder.status) {
          case "preparing":
            notificationMessage = `Restaurant has accepted and is preparing your order #${updatedOrder.order_id}.`;
            break;
          case "restaurant_rejected":
            notificationMessage = `Restaurant has rejected your order #${updatedOrder.order_id}.`;
            break;
          case "ready_for_pickup":
            notificationMessage = `Your order #${updatedOrder.order_id} is ready for pickup by the rider.`;
            break;
          case "out_for_delivery":
            notificationMessage = `Your order #${updatedOrder.order_id} is out for delivery!`;
            break;
          case "delivered":
            notificationMessage = `Your order #${updatedOrder.order_id} has been delivered. Enjoy your meal!`;
            break;
        }
        addNotification({
          type: "order_update",
          message: notificationMessage,
        });
      };

      socketService.on("order_accepted", handleOrderAccepted);
      socketService.on("order_status_updated", handleOrderStatusUpdated);

      return () => {
        socketService.off("order_accepted", handleOrderAccepted);
        socketService.off("order_status_updated", handleOrderStatusUpdated);
      };
    }
  }, [currentUserType, addNotification]);


  if (isCheckingAuth || isCheckingRestaurant || isCheckingAuthRider)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      <Toaster />
      {/* <Navbar /> */}
      <Routes>
        {/* Customer */}
        <Route
          path="/"
          element={
            authrider ? (
              <Navigate to="/rider" />
            ) : authRestaurant ? (
              <Navigate to="/partner" />
            ) : (
              <HomePage />
            )
          }
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignupPage /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route path="/restaurants" element={<RestaurantPage />} />
        <Route path="/restaurant/:id" element={<RestaurantProfie />} />
        <Route
          path="/restaurant/:restaurantId/reviews"
          element={<RestaurantReviewsPage />}
        />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-history" element={<OrderHistoryPage />} />
        <Route
          path="/simulate-payment-gateway"
          element={<SimulatePaymentGateway />}
        />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-fail" element={<PaymentFailedPage />} />
        <Route path="/payment-cancel" element={<PaymentCancelledPage />} />
        <Route
          path="/chat/:orderId"
          element={<ChatPage />}
        />

        {/* Restaurant */}
        <Route path="/partner" element={<HomepageRest />} />

        {/* Rider */}
        <Route
          path="/rider/login"
          element={!authrider ? <LoginPageRider /> : <Navigate to="/rider" />}
        />
        <Route
          path="/rider/signup"
          element={!authrider ? <SignupPageRider /> : <Navigate to="/rider" />}
        />
        <Route
          path="/rider"
          element={
            authrider ? <HomepageRider /> : <Navigate to="/rider/login" />
          }
        />
        <Route
          path="/rider/history"
          element={
            authrider ? <DeliveryHistoryPage /> : <Navigate to="/rider/login" />
          }
        />
        <Route
          path="/rider/data/profile"
          element={
            authrider ? <ProfilePageRider /> : <Navigate to="/rider/login" />
          }
        />
        <Route
          path="/rider/data/orders/:orderId"
          element={
            authrider ? <OrderDetailsPage /> : <Navigate to="/rider/login" />
          }
        />
        <Route
          path="/rider/earnings"
          element={
            authrider ? <EarningsPage /> : <Navigate to="/rider/login" />
          }
        />
      </Routes>
      <ChatModal
        isOpen={isChatOpen}
        onClose={closeChat}
        orderId={chatOrderId}
        currentAuthUser={currentAuthUser}
      />
      <footer className="w-full py-3 px-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
        <span>© MealMate</span>
        <button
          onClick={() => {
            Sentry.captureException(new Error("Test Frontend Sentry Error!"));
            alert("Frontend Sentry error triggered! Check your Sentry dashboard.");
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded shadow cursor-pointer transition-colors"
        >
          🚨 Sentry Test
        </button>
      </footer>
    </div>
  );
}

export default App;


