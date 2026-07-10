import React, { useState, useEffect } from "react";
import { Loader2, MapPin } from "lucide-react";
import { userAuthStore } from "../store/userAuthStore";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/skeleton/Navbar";
import LocationPickerModal from "../Components/LocationPickerModal";
import toast from "react-hot-toast";

function Signup() {
  const navigate = useNavigate();
  const { signup, isSigningUp, authUser } = userAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  useEffect(() => {
    if (authUser) {
      navigate("/");
    }
  }, [authUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (location.lat === null || location.lng === null) {
      toast.error("Please pick your location on the map.");
      return;
    }
    await signup({ ...formData, latitude: location.lat, longitude: location.lng });
  };

  return (
    <>
      <Navbar />
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow dark:bg-gray-800 p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Create an account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full p-2.5 border rounded-lg bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="bishnu das"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full p-2.5 border rounded-lg bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full p-2.5 border rounded-lg bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Location Coordinate
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border rounded-lg bg-gray-50 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                >
                  <MapPin className="h-4 w-4 text-primary-600" />
                  Pick Location
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {location.lat !== null && location.lng !== null
                    ? `Selected: (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
                    : "No location selected"}
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSigningUp}
              className="w-full flex justify-center items-center gap-2 bg-primary-600 text-white py-2.5 px-5 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                Sign in
              </a>
            </p>
          </form>
        </div>
      </section>
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelect={(coords) => setLocation(coords)}
        initialLocation={location.lat ? location : { lat: 23.8103, lng: 90.4125 }}
      />
    </>
  );
}

export default Signup;
