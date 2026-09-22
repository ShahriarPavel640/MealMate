import React from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Restaurant } from "@/types/models";

interface RestaurantHeaderProps {
  restaurant: Restaurant;
}

export function RestaurantHeader({ restaurant }: RestaurantHeaderProps): React.JSX.Element {
  const navigate = useNavigate();

  const targetId = restaurant.restaurant_id || restaurant.id || 0;
  const displayImage = restaurant.image || restaurant.image_url || "";
  const displayRating = restaurant.rating ?? restaurant.average_rating ?? restaurant.avg_rating ?? "N/A";
  const displayDescription = restaurant.descriptions || restaurant.description || "";
  const displayPhone = restaurant.phone || restaurant.phone_number || "";

  return (
    <div className="bg-[#0a0a0a]">
      {/* Hero Image + Overlay */}
      <div className="relative h-64 md:h-[400px] w-full shadow-2xl">
        <img
          src={displayImage}
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

            {displayDescription && (
              <p className="text-xl md:text-2xl text-gray-300 font-medium max-w-3xl drop-shadow-sm">
                {displayDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10 rounded-full px-4 py-2 cursor-pointer shadow-lg group"
                onClick={() =>
                  navigate(`/restaurant/${targetId}/reviews`)
                }
              >
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-white text-md">
                  {displayRating !== "N/A"
                    ? parseFloat(String(displayRating)).toFixed(1)
                    : "N/A"}
                </span>
                <span className="text-gray-300 font-medium text-xs group-hover:text-white transition-colors">View all reviews</span>
              </div>

              {displayPhone && (
                <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/10 cursor-pointer" title="Call restaurant">
                  <span className="text-white text-sm font-medium">📞 {displayPhone}</span>
                </div>
              )}
              
              {restaurant.email && (
                <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/10 cursor-pointer" title="Email restaurant">
                  <span className="text-white text-sm font-medium">📧 {restaurant.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
