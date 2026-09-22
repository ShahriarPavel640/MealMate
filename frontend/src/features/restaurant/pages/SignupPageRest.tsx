import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import { useNavigate } from "react-router-dom";

const SignupPageRest: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isSigningUp, authRestaurant } = restaurantAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (authRestaurant) {
      navigate("/restaurant/");
    }
  }, [authRestaurant, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(formData);
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow dark:bg-gray-800 p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Create an account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Restaurant Name
            </label>
            <input
              type="text"
              required
              className="w-full p-2.5 border rounded-lg bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="restaurant name"
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
              href="/partner/login"
              className="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default SignupPageRest;
