import React from "react";
import { Plus, Star, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";
import { Card } from "@/features/restaurant/components/ui/card";
import { Badge } from "@/features/restaurant/components/ui/badge";
import { cn } from "@/lib/utils";

export function FoodItem({ item, onAddToCart, cartItems }) {
  const isInCart = cartItems.some(
    (cartItem) => cartItem.menu_item_id === item.menu_item_id
  );

  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-900 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800 shadow-sm hover:-translate-y-1 group rounded-3xl">
      <div className="md:flex">
        {/* Image */}
        <div className="m-3 rounded-2xl md:w-48 h-40 md:h-36 relative overflow-hidden shadow-sm">
          <img
            src={item.menu_item_image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {item.isPopular && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold shadow-lg">
                <TrendingUp className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            )}
            {item.isVegetarian && (
              <Badge className="bg-green-500 text-white font-bold shadow-lg">
                <div className="w-3 h-3 border border-white rounded-full mr-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                </div>
                Veg
              </Badge>
            )}
          </div>

          {/* Discount Badge */}
          {item.discount && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white font-bold shadow-lg">
              {Math.round((item.discount / item.price) * 100)}% OFF
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              {/* Name */}
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                {item.name}
              </h3>

              {/* Rating & Prep Time */}
              <div className="flex items-center gap-4 mb-3">
                {item.average_rating && (
                  <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-green-500 text-green-500" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {item.average_rating}
                    </span>
                  </div>
                )}
                {item.prep_time && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{item.prep_time} min</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              {/* Price & Discount */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  Tk {item.price}
                </span>
                {item.discount && (
                  <span className="text-lg text-gray-400 line-through">
                    Tk {(item.price / (1 - item.discount)).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {/* Add Button */}
            <div className="flex justify-items-end-safe">
              <Button
                onClick={() => onAddToCart(item)}
                size="lg"
                className={cn(
                  "px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg",
                  isInCart
                    ? "bg-green-500 hover:bg-green-600 text-white cursor-default transform scale-105"
                    : "bg-[#e21b70] hover:bg-[#c2145d] text-white hover:scale-105 hover:shadow-lg"
                )}
                disabled={isInCart}
              >
                {isInCart ? (
                  <>
                    <span className="mr-2">✓</span>
                    Added to Cart
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
