import React from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

export function RestaurantHeader({ restaurant }) {
  const navigate = useNavigate();
  return (
    <div className="bg-[#0a0a0a]">
      {/* Hero Image + Overlay */}
      <div className="relative h-64 md:h-[400px] w-full shadow-2xl">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {/* Sleek Gradient Overlay for Premium Dark Look */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/60 to-transparent" />

        {/* Restaurant Info Overlaid on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-7xl mx-auto flex flex-col items-start gap-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
              {restaurant.name}
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 font-medium max-w-3xl drop-shadow-sm">
              {restaurant.descriptions}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 cursor-pointer shadow-lg"
                onClick={() =>
                  navigate(`/restaurant/${restaurant.restaurant_id}/reviews`)
                }
              >
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-white text-lg">
                  {restaurant.rating
                    ? parseFloat(restaurant.rating).toFixed(1)
                    : "N/A"}
                </span>
                <span className="text-gray-300 font-medium text-sm">Reviews</span>
              </div>
              
              <div className="flex items-center gap-2 bg-[#e21b70]/90 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg border border-[#e21b70]">
                <span className="font-bold text-white text-sm">
                  {restaurant.cuisine} Cuisine
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
