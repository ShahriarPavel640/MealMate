import React, { useState, useEffect } from "react";
import { Button } from "@/features/restaurant/components/ui/button";
import { Card, CardContent } from "@/features/restaurant/components/ui/card";
import { Badge } from "@/features/restaurant/components/ui/badge";
import { Checkbox } from "@/features/restaurant/components/ui/checkbox";
import { Label } from "@/features/restaurant/components/ui/label";
import { Slider } from "@/features/restaurant/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/restaurant/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/restaurant/components/ui/popover";
import {
  Filter,
  ChevronDown,
  X,
  DollarSign,
  TrendingUp,
  Clock
} from "lucide-react";

const sortOptions = [
  { value: 'relevance', label: 'Relevance', icon: TrendingUp },
  { value: 'price-low', label: 'Price: Low to High', icon: DollarSign },
  { value: 'price-high', label: 'Price: High to Low', icon: DollarSign },
  { value: 'most-sold', label: 'Most Popular', icon: TrendingUp },
  { value: 'newest', label: 'Newest First', icon: Clock }
];

export const FoodFilter = ({ menuCategories, onFilterChange, maxPrice = 2000 }) => {
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    priceRange: [0, maxPrice],
    selectedCategories: []
  });

  // Automatically adjust the price range if maxPrice changes (e.g., after loading from API)
  useEffect(() => {
    setFilters(prev => {
      // If the upper bound of the current filter is the old max, update it to the new max.
      // Or just safely ensure the upper bound isn't exceeding or stuck too low if it's untouched.
      return { ...prev, priceRange: [prev.priceRange[0], maxPrice] };
    });
  }, [maxPrice]);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const handleCategoryChange = (categoryId, checked) => {
    const newCategories = checked
      ? [...filters.selectedCategories, categoryId]
      : filters.selectedCategories.filter(id => id !== categoryId);
    
    const newFilters = { ...filters, selectedCategories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (value) => {
    const newFilters = { ...filters, priceRange: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortByChange = (value) => {
    const newFilters = { ...filters, sortBy: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const removeCategory = (categoryId) => {
    const newCategories = filters.selectedCategories.filter(id => id !== categoryId);
    const newFilters = { ...filters, selectedCategories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      sortBy: 'relevance',
      priceRange: [0, maxPrice],
      selectedCategories: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFiltersCount = filters.selectedCategories.length + 
    (filters.sortBy !== 'relevance' ? 1 : 0) + 
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== maxPrice ? 1 : 0);

  return (
    <Card className="w-full shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Main Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Sort By */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</Label>
            <Select value={filters.sortBy} onValueChange={handleSortByChange}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 transition-colors text-gray-900 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-lg">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories</Label>
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 transition-colors text-gray-900 dark:text-gray-100"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {filters.selectedCategories.length === 0 
                      ? 'All Categories' 
                      : `${filters.selectedCategories.length} selected`
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-xl" align="start">
                <div className="p-4 border-b border-gray-100 dark:border-gray-600">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Select Categories</h3>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {menuCategories.map((category) => (
                      <div key={category.category_id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={category.category_id}
                            checked={filters.selectedCategories.includes(category.category_id)}
                            onCheckedChange={(checked) => 
                              handleCategoryChange(category.category_id, checked)
                            }
                            className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <Label 
                            htmlFor={category.category_id} 
                            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                          >
                            {category.name}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Price Range: Tk {filters.priceRange[0]} - Tk {filters.priceRange[1]}
            </Label>
            <div className="px-3 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceChange}
                max={maxPrice}
                min={0}
                step={20}
                className="w-full [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Selected Categories Tags */}
        {filters.selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Selected:</span>
            {filters.selectedCategories.map((categoryId) => {
              const category = menuCategories.find(c => c.category_id === categoryId);
              return (
                <Badge 
                  key={categoryId} 
                  variant="secondary" 
                  className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                >
                  {category?.name}
                  <button
                    onClick={() => removeCategory(categoryId)}
                    className="ml-2 hover:bg-orange-300 dark:hover:bg-orange-700 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
