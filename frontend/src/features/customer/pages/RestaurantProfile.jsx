import { useEffect, useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

import { Input } from "@/features/restaurant/components/ui/input";
import { RestaurantHeader } from "@/features/customer/components/restaurantprofile/RestaurantHeader";
import { FoodItem } from "@/features/customer/components/restaurantprofile/FoodItem";
import { CartSidebar } from "@/features/customer/components/restaurantprofile/CartSidebar";
import { FoodFilter } from "@/features/customer/components/restaurantprofile/FoodFilter";
import { axiosInstance } from "@/lib/axios";
import { useCartStore } from "@/features/customer/store/cartStore";
import { userAuthStore } from "@/features/customer/store/userAuthStore";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/features/customer/components/skeleton/Navbar";

export default function Restaurant() {
  const [activeCategory, setActiveCategory] = useState("Popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart } =
    useCartStore();
  const { authUser } = userAuthStore();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [menuItems, setmenuItems] = useState([]);
  const menuItemsRef = useRef(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [restaurant, setRestaurant] = useState();
  const [maxPrice, setMaxPrice] = useState(2000);

  const [filters, setFilters] = useState({
    sortBy: "relevance",
    priceRange: [0, 2000],
    selectedCategories: [],
  });

  const { id } = useParams();
  console.log("rest id: ", id);

  useEffect(() => {
    axiosInstance
      .get(`/customer/getRestaurant/${id}`)
      .then((res) => {
        setRestaurant(res.data.restaruntDetails);
        setmenuItems(res.data.menuItems);
        // Extract unique categories from menuItems
        const uniqueCategories = [
          ...new Set(res.data.menuItems.map((item) => item.category_name)),
        ].map((category_name) => {
          const item = res.data.menuItems.find(
            (item) => item.category_name === category_name
          );
          return {
            category_id: item.category_id,
            name: category_name,
            menu_category_image_url: item.menu_category_image_url,
          };
        });
        setMenuCategories(uniqueCategories);
        const calculatedMax = res.data.menuItems.length > 0
          ? Math.max(...res.data.menuItems.map((item) => Number(item.price)))
          : 2000;
        setMaxPrice(calculatedMax);
        setFilters(prev => ({ ...prev, priceRange: [0, calculatedMax] }));
        console.log("Restaurant data: ", res.data);
      })
      .catch((err) => {
        console.error("Error fetching restaurant details:", err);
      });
  }, [id]);

  const filteredItems = menuItems
    .filter((item) => {
      const matchesCategory =
        filters.selectedCategories.length === 0 ||
        filters.selectedCategories.includes(item.category_id);
      const matchesPrice =
        item.price >= filters.priceRange[0] &&
        item.price <= filters.priceRange[1];
      const matchesSearch =
        (item.name &&
          item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesPrice && matchesSearch;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "most-sold":
          return b.order_count - a.order_count;
        default:
          return 0;
      }
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (menuItemsRef.current) {
      menuItemsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!authUser) {
      clearCart();
    }
  }, [authUser, clearCart]);

  const handleAddToCart = async (item) => {
    if (restaurant && restaurant.is_open === false) {
      toast.error("This restaurant is currently unavailable.");
      return;
    }
    if (item && item.is_available === false) {
      toast.error("This item is currently unavailable.");
      return;
    }
    if (!authUser) {
      toast.error("Please log in to add items to your cart.");
      return;
    }
    try {
      const res = await axiosInstance.post("/customer/add_cart", {
        menu_item_id: item.menu_item_id,
        restaurant_id: restaurant.restaurant_id,
        quantity: 1,
      });
      addToCart({
        ...item,
        quantity: 1,
        cart_item_id: res.data.item.cart_item_id,
        restaurant_name: restaurant.name,
        restaurant_id: restaurant.restaurant_id,
      });
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  const handleUpdateQuantity = async (menu_item_id, quantity) => {
    try {
      if (quantity === 0) {
        await axiosInstance.delete(`/customer/cart/${menu_item_id}`);
        removeFromCart(menu_item_id);
      } else {
        await axiosInstance.post("/customer/add_cart", {
          menu_item_id: menu_item_id,
          restaurant_id: restaurant.restaurant_id,
          quantity: quantity,
        });
        updateQuantity(menu_item_id, quantity);
      }
    } catch (err) {
      console.error("Error updating cart quantity:", err);
    }
  };

  const handleRemoveItem = async (cart_item_id) => {
    console.log("Attempting to remove item with cart_item_id:", cart_item_id);
    try {
      await axiosInstance.delete(`/customer/cart/${cart_item_id}`);
      removeFromCart(cart_item_id);
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-500">
        {/* Dark Mode Toggle */}
        <div className="container mx-auto px-6 py-4 flex justify-end">
          {/* <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 border rounded-md border-gray-700 dark:border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button> */}
        </div>

        {/* Restaurant Header */}
        {restaurant && (
          <div className="shadow-lg bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <RestaurantHeader restaurant={restaurant} />
            {restaurant.is_open === false && (
              <div className="bg-red-500/10 border-t border-red-500/20 px-6 py-3 text-center">
                <p className="text-red-600 dark:text-red-400 font-bold tracking-wide uppercase text-sm">
                  This restaurant is currently unavailable. You cannot place orders at this time.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="container mx-auto px-6 py-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <Input
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:shadow-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
            />
          </div>
        </div>

        <div className="container mx-auto px-6 pb-8">
          <FoodFilter
            menuCategories={menuCategories}
            onFilterChange={setFilters}
            maxPrice={maxPrice}
          />
        </div>

        <div className="flex flex-col lg:flex-row container mx-auto px-6 pb-12 gap-6">
          <div className="flex-grow">
            {/* Menu Items */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
              ref={menuItemsRef}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                {activeCategory === "Popular"
                  ? "Popular Dishes"
                  : `${activeCategory} Menu`}
              </h2>
              <div className="space-y-6">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                      No items found matching your search.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Try searching with different keywords or browse our
                      categories.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {currentItems.map((item) => (
                      <div
                        key={item.menu_item_id}
                        className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-600"
                      >
                        <FoodItem
                          key={item.menu_item_id}
                          item={item}
                          onAddToCart={handleAddToCart}
                          cartItems={cartItems}
                          restaurant_is_open={restaurant?.is_open}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? "bg-pink-500 text-white shadow-lg"
                          : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className="mt-6 text-center text-gray-600">
              Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredItems.length)} of{" "}
              {filteredItems.length} items
            </div>
          </div>

          {/* Cart Sidebar */}
          {authUser && (
            <CartSidebar
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}
