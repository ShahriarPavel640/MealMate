import React, { useEffect, useState, useRef } from "react";
import RestaurantCard from "@/features/customer/components/cards/RestaurantCard";
import { useRestaurantStore } from "@/features/customer/store/useRestaurantStore";
import { Loader2, Search } from "lucide-react";
import Navbar from "@/features/customer/components/skeleton/Navbar";

const RestaurantPage = () => {
  const { restaurants, getrestaurants, searchRestaurantsByName, loading } =
    useRestaurantStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Display 6 restaurants per page
  const restaurantsRef = useRef(null);

  useEffect(() => {
    getrestaurants();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      getrestaurants();
    } else {
      await searchRestaurantsByName(searchTerm.trim());
    }
    // Reset to first page when searching
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Pagination calculations
  const totalPages = Math.ceil((restaurants?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRestaurants = restaurants?.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (restaurantsRef.current) {
      restaurantsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Navbar />
      <section className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            All Restaurants
          </h1>

          <div className="flex items-center text-gray-700 gap-2 mb-8 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition flex items-center gap-1"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
              <span className="ml-2 text-pink-500">Loading...</span>
            </div>
          ) : (
            <div ref={restaurantsRef}>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants && restaurants.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg">
                      No restaurants found.
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Try adjusting your search criteria or check back later.
                    </p>
                  </div>
                ) : (
                  currentRestaurants?.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                    />
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {restaurants && restaurants.length > 0 && totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
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
                            : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
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
                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Results summary */}
              {restaurants && restaurants.length > 0 && (
                <div className="mt-6 text-center text-gray-600 text-sm">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, restaurants.length)} of{" "}
                  {restaurants.length} restaurants
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default RestaurantPage;

// import React, { useEffect, useState } from "react";
// import RestaurantCard from "@/features/customer/components/cards/RestaurantCard";
// import { useRestaurantStore } from "@/features/customer/store/useRestaurantStore";
// import { Loader2, Search } from "lucide-react";
// import Navbar from "@/features/customer/components/skeleton/Navbar";

// const RestaurantPage = () => {
//   const { restaurants, getrestaurants, searchRestaurantsByName, loading } =
//     useRestaurantStore();

//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     getrestaurants();
//   }, []);

//   const handleSearch = async () => {
//     if (!searchTerm.trim()) {
//       getrestaurants();
//     } else {
//       await searchRestaurantsByName(searchTerm.trim());
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") handleSearch();
//   };

//   return (
//     <>
//       <Navbar />
//       <section className="min-h-screen bg-gray-50 py-10">
//         <div className="max-w-7xl mx-auto px-4">
//           <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
//             All Restaurants
//           </h1>

//           <div className="flex items-center text-gray-700 gap-2 mb-8 max-w-md mx-auto">
//             <input
//               type="text"
//               placeholder="Search restaurants..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               onKeyDown={handleKeyPress}
//               className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
//             />
//             <button
//               onClick={handleSearch}
//               className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition flex items-center gap-1"
//             >
//               <Search className="w-4 h-4" />
//               Search
//             </button>
//           </div>

//           {loading ? (
//             <div className="flex justify-center items-center py-20">
//               <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
//               <span className="ml-2 text-pink-500">Loading...</span>
//             </div>
//           ) : (
//             <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
//               {restaurants && restaurants.length === 0 ? (
//                 <p className="text-gray-500">No restaurants found.</p>
//               ) : (
//                 restaurants?.map((restaurant) => (
//                   <RestaurantCard key={restaurant.id} restaurant={restaurant} />
//                 ))
//               )}
//             </div>
//           )}
//         </div>
//       </section>
//     </>
//   );
// };

// export default RestaurantPage;

// // import React, { useEffect } from "react";
// // import RestaurantCard from "@/features/customer/components/cards/RestaurantCard";
// // import { useRestaurantStore } from "@/features/customer/store/useRestaurantStore";
// // import { Loader2 } from "lucide-react";
// // import Navbar from "@/features/customer/components/skeleton/Navbar";

// // const RestaurantPage = () => {
// //   const { restaurants, getrestaurants } = useRestaurantStore();

// //   useEffect(() => {
// //     getrestaurants();

// //     {
// //       //console.log(restaurants);
// //     }
// //   }, []);

// //   return (
// //     <>
// //       <Navbar />
// //       <section className="min-h-screen bg-gray-50 py-10">
// //         <div className="max-w-7xl mx-auto px-4">
// //           <h1 className="text-3xl font-bold text-gray-800 mb-6">
// //             All Restaurants
// //           </h1>
// //           {console.log("in restaurant page", restaurants)}

// //           {!restaurants ? (
// //             <div className="flex justify-center items-center py-20">
// //               <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
// //               <span className="ml-2 text-pink-500">Loading...</span>
// //             </div>
// //           ) : (
// //             <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
// //               {restaurants.length === 0 ? (
// //                 <p className="text-gray-500">No restaurants found.</p>
// //               ) : (
// //                 restaurants.map((restaurant) => (
// //                   <RestaurantCard key={restaurant.id} restaurant={restaurant} />
// //                 ))
// //               )}
// //             </div>
// //           )}
// //         </div>
// //       </section>
// //     </>
// //   );
// // };

// // export default RestaurantPage;
