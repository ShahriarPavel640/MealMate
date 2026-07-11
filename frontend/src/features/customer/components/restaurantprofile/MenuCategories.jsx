import React from "react";
import { cn } from "@/lib/utils";

export function MenuCategories({
  categories,
  activeCategory,
  onCategoryChange,
}) {
  return (
    <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-20 shadow-lg">
      <div className="container mx-auto px-6 py-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Browse Menu
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {/* Popular Category (Always First) */}
          <button
            onClick={() => onCategoryChange("Popular")}
            className={cn(
              "px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2",
              activeCategory === "Popular"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            )}
          >
            <span className="text-lg">🔥</span>
            Popular
          </button>

          {/* Other Categories */}
          {categories.map((category) => (
            <button
              key={category.category_id}
              onClick={() => onCategoryChange(category.name)}
              className={cn(
                "px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2",
                activeCategory === category.name
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              )}
            >
              {category.menu_category_image_url && (
                <img 
                  src={category.menu_category_image_url} 
                  alt={category.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
