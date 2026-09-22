import React from "react";
import {
  Home,
  Menu,
  ShoppingBag,
  User,
  BarChart3,
  ChefHat,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarRestProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "menu", label: "Menu Management", icon: Menu },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Restaurant Profile", icon: User },
  { id: "reviews", label: "Customer Reviews", icon: Star },
];

function SidebarRest({ activeTab, setActiveTab }: SidebarRestProps): React.JSX.Element {
  return (
    <div className="w-64 bg-gray-900 shadow-lg border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">MealMate</h2>
            <p className="text-sm text-gray-400">Restaurant Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 mb-1",
              activeTab === item.id
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default SidebarRest;
