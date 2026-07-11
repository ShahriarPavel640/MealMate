import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Clock,
  MapPin,
  Info,
  Truck,
  DollarSign,
  Award,
} from "lucide-react";
import restaurantHero from "@/assets/burger-deluxe.jpg";
import { Badge } from "@/features/restaurant/components/ui/badge";

export function RestaurantHeader({ restaurant }) {
  const navigate = useNavigate();
  return (
    <>
      {/* Hero Image + Overlay */}
      <div className="relative">
        <div className="h-56 md:h-72 relative overflow-hidden">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

          {/* Decorative Elements */}
          <div className="absolute top-6 right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-16 h-16 bg-orange-500/20 rounded-full blur-xl"></div>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="text-white max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                {restaurant.name}
              </h1>
              <Badge className="bg-orange-500 text-white font-bold px-3 py-1 shadow-lg">
                <Award className="h-4 w-4 mr-1" />
                Premium
              </Badge>
            </div>

            <p className="text-xl text-gray-200 mb-4 font-medium">
              {restaurant.cuisine}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 cursor-pointer"
                onClick={() =>
                  navigate(`/restaurant/${restaurant.restaurant_id}/reviews`)
                }
              >
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">
                  {restaurant.rating
                    ? parseFloat(restaurant.rating).toFixed(1)
                    : "N/A"}
                </span>
                <span className="text-gray-300">Reviews</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="font-semibold">{restaurant.deliveryTime}</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span className="font-semibold">{restaurant.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-grident-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto px-8 py-6">
          <p className="text-gray-500">{restaurant.descriptions}</p>
        </div>
      </div>

      {/* Delivery Info Cards */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto px-8 py-6">
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Delivery Fee
                </p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  ${restaurant.deliveryFee}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Minimum Order
                </p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  ${restaurant.minOrder}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl px-6 py-4 shadow-lg text-white hover:shadow-xl transition-all duration-300">
              <div className="p-2 bg-white/20 rounded-full">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-green-100">Free Delivery</p>
                <p className="font-bold text-lg">Orders over $25</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
