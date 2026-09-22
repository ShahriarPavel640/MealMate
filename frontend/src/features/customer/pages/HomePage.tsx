import React, { useEffect } from "react";
import HeroSection from "@/features/customer/components/HeroSection";
import FeaturesSection from "@/features/customer/components/FeaturesSection";
import FeaturedRestaurants from "@/features/customer/components/FeaturedRestaurants";
import CTASection from "@/features/customer/components/CTASection";
import { useRestaurantStore } from "@/features/customer/store/useRestaurantStore";
import Navbar from "@/features/customer/components/skeleton/Navbar";

const Home: React.FC = () => {
  const { restaurants, getrestaurants, loading, getcategories } =
    useRestaurantStore();

  // Effect for fetching initial data (restaurants, categories)
  useEffect(() => {
    getrestaurants();
    getcategories();
  }, [getrestaurants, getcategories]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <HeroSection />
      <FeaturesSection />

      {loading ? (
        <div className="text-center py-20 text-xl text-gray-500">
          Loading restaurants...
        </div>
      ) : (
        <FeaturedRestaurants restaurants={restaurants} />
      )}

      <CTASection />
    </div>
  );
};

export default Home;
