import React from "react";
import { useSearchParams } from "react-router-dom";
import SidebarRest from "@/features/restaurant/components/SidebarRest";
import HeaderRest from "@/features/restaurant/components/HeaderRest";
import DashboardRest from "@/features/restaurant/components/DashboardRest";
import MenuManagementRest from "@/features/restaurant/components/MenuManagementRest";
import OrderManagement from "@/features/restaurant/components/OrderManagementRest";
import RestaurantProfile from "@/features/restaurant/components/RestaurantProfile";
import AnalyticsRest from "@/features/restaurant/components/AnalyticsRest";
import LoginPage from "@/features/restaurant/components/LoginPageRest";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import RestaurantReviewsPage from "@/features/restaurant/components/RestaurantReviewDashboard";

function HomepageRest() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  const { authRestaurant } = restaurantAuthStore();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardRest activeTab={activeTab} setActiveTab={setActiveTab} />
        );
      case "menu":
        return <MenuManagementRest />;
      case "orders":
        return <OrderManagement />;
      case "profile":
        return <RestaurantProfile />;
      case "analytics":
        return <AnalyticsRest />;
      case "reviews":
        return <RestaurantReviewsPage />;
      default:
        return <DashboardRest />;
    }
  };

  if (!authRestaurant) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <SidebarRest activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <HeaderRest />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}

export default HomepageRest;
