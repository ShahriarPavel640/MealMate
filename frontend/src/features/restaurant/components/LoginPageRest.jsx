/* eslint-disable */
import React, { useState } from "react";
import { Button } from "@/features/restaurant/components/ui/button";
import { Input } from "@/features/restaurant/components/ui/input";
import { Label } from "@/features/restaurant/components/ui/label";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/restaurant/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/features/restaurant/components/ui/tabs";
import { ChefHat, TrendingUp, Users, Clock, Star, Shield, MapPin } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import LocationPickerModal from "@/features/customer/components/LocationPickerModal";
import toast from "react-hot-toast";

const LoginPage = () => {
  const { login, signup, isLoggingIn, authRestaurant, isSigningUp } =
    restaurantAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formDataSignup, setFormDataSignup] = useState({
    email: "",
    password: "",
    phone: "",
    name: "",
    latitude: null,
    longitude: null,
  });
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(formData);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formDataSignup.latitude === null || formDataSignup.longitude === null) {
      toast.error("Please pick your restaurant's location on the map.");
      return;
    }
    await signup(formDataSignup);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-[#e21b70]" />
              <span className="text-2xl font-bold text-[#e21b70]">
                MealMate Partner
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                href="#features"
                className="text-gray-400 hover:text-[#e21b70] transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-400 hover:text-[#e21b70] transition-colors"
              >
                Pricing
              </a>
              <a
                href="#support"
                className="text-gray-400 hover:text-[#e21b70] transition-colors"
              >
                Support
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Grow Your Restaurant Business with
                <span className="text-[#e21b70]">
                  {" "}
                  MealMate Partner
                </span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Join thousands of restaurant partners who trust us to manage
                their online presence, orders, and customer relationships. Boost
                your revenue by up to 40%.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="bg-pink-950/60 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-[#e21b70]" />
                </div>
                <div>
                  <h3 className="font-semibold">Boost Sales</h3>
                  <p className="text-sm text-gray-400">Increase revenue</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-red-900 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">More Customers</h3>
                  <p className="text-sm text-gray-400">Expand reach</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-900 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Save Time</h3>
                  <p className="text-sm text-gray-400">Automate orders</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-900 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure</h3>
                  <p className="text-sm text-gray-400">Protected data</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-sm text-gray-400">
                    Restaurant Partners
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1M+</div>
                  <div className="text-sm text-gray-400">Orders Processed</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold">4.9</span>
                  </div>
                  <div className="text-sm text-gray-400">Average Rating</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:max-w-md mx-auto w-full h-[500px] transition-all duration-300">
            <Card className="shadow-2xl border border-gray-800 bg-gray-900">
              <CardHeader className="text-center space-y-1">
                <CardTitle className="text-2xl font-bold text-cyan-600">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Sign in to your restaurant dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                    <TabsTrigger
                      value="login"
                      className="text-purple-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white rounded-t-md"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="text-purple-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white rounded-t-md"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@restaurant.com"
                          className="bg-gray-800 text-white placeholder-gray-400"
                          value={formData.email}
                          required
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          className="bg-gray-800 text-white placeholder-gray-400"
                          required
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-[#e21b70] hover:bg-[#c2145d] text-white"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4 mt-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="restaurant-name">Restaurant Name</Label>
                        <Input
                          id="restaurant-name"
                          type="text"
                          placeholder="Your Restaurant Name"
                          className="bg-gray-800 text-white placeholder-gray-400"
                          required
                          value={formDataSignup.name}
                          onChange={(e) => {
                            setFormDataSignup({
                              ...formDataSignup,
                              name: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@restaurant.com"
                          className="bg-gray-800 text-white placeholder-gray-400"
                          required
                          value={formDataSignup.email}
                          onChange={(e) => {
                            setFormDataSignup({
                              ...formDataSignup,
                              email: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={formDataSignup.password}
                          className="bg-gray-800 text-white placeholder-gray-400"
                          onChange={(e) => {
                            setFormDataSignup({
                              ...formDataSignup,
                              password: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="bg-gray-800 text-white placeholder-gray-400"
                          required
                          value={formDataSignup.phone}
                          onChange={(e) => {
                            setFormDataSignup({
                              ...formDataSignup,
                              phone: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location Coordinate</Label>
                        <div className="flex gap-2 items-center">
                          <Button
                            type="button"
                            onClick={() => setLocationModalOpen(true)}
                            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 flex items-center gap-1.5"
                          >
                            <MapPin className="h-4 w-4 text-[#e21b70]" />
                            Pick Location
                          </Button>
                          <span className="text-sm text-gray-400">
                            {formDataSignup.latitude !== null && formDataSignup.longitude !== null
                              ? `Selected: (${formDataSignup.latitude.toFixed(4)}, ${formDataSignup.longitude.toFixed(4)})`
                              : "No location picked"}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-[#e21b70] hover:bg-[#c2145d] text-white"
                        disabled={isSigningUp}
                      >
                        {isSigningUp ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 mb-4">
                Trusted by leading restaurants worldwide
              </p>
              <div className="flex justify-center space-x-8 opacity-60">
                <div className="text-xs font-semibold text-gray-500">
                  PIZZA HUT
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  SUBWAY
                </div>
                <div className="text-xs font-semibold text-gray-500">KFC</div>
                <div className="text-xs font-semibold text-gray-500">
                  McDONALD'S
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-6 w-6 text-[#e21b70]" />
                <span className="text-xl font-bold">MealMate Partner</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering restaurants to thrive in the digital age.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Menu Management
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Order Tracking
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Training
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Legal
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 MealMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelect={(coords) =>
          setFormDataSignup((prev) => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng,
          }))
        }
        initialLocation={
          formDataSignup.latitude
            ? { lat: formDataSignup.latitude, lng: formDataSignup.longitude }
            : { lat: 23.8103, lng: 90.4125 }
        }
      />
    </div>
  );
};

LoginPage.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default LoginPage;
