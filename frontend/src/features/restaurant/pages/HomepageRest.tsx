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

const HomepageRest: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };
  const { authRestaurant } = restaurantAuthStore();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardRest setActiveTab={setActiveTab} />
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
        return <DashboardRest setActiveTab={setActiveTab} />;
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
};

export default HomepageRest;
