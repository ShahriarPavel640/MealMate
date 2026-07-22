import React, { useEffect } from "react";
import HeroSection from "@/features/customer/components/HeroSection";
import FeaturesSection from "@/features/customer/components/FeaturesSection";
import FeaturedRestaurants from "@/features/customer/components/FeaturedRestaurants";
import CTASection from "@/features/customer/components/CTASection";
import { useRestaurantStore } from "@/features/customer/store/useRestaurantStore";
import FeaturedCategories from "@/features/customer/components/FeaturedCategory";
import Navbar from "@/features/customer/components/skeleton/Navbar";
import { userAuthStore } from "@/features/customer/store/userAuthStore";

const Home = () => {
  const { restaurants, categories, getrestaurants, loading, getcategories } =
    useRestaurantStore();
  const { authUser: user } = userAuthStore();

  // Effect for fetching initial data (restaurants, categories)
  useEffect(() => {
    getrestaurants();
    getcategories();
  }, []);



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

      {/* <FeaturedCategories categories={categories} /> */}
      <CTASection />
    </div>
  );
};

export default Home;
