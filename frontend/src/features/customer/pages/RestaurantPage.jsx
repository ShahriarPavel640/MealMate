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
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const itemsPerPage = 9; // Display 9 restaurants per page
  const restaurantsRef = useRef(null);

  const fetchRestaurants = async (page) => {
    let res;
    if (!searchTerm.trim()) {
      res = await getrestaurants(page, itemsPerPage);
    } else {
      res = await searchRestaurantsByName(searchTerm.trim(), page, itemsPerPage);
    }
    if (res?.pagination) {
      setServerTotalPages(res.pagination.totalPages);
    }
  };

  useEffect(() => {
    fetchRestaurants(currentPage);
  }, [currentPage]);

  const handleSearch = async () => {
    // Reset to first page when searching; useEffect will trigger fetch
    if (currentPage === 1) {
      await fetchRestaurants(1);
    } else {
      setCurrentPage(1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Pagination calculations
  const totalPages = serverTotalPages;
  const currentRestaurants = restaurants; // Backend handles slicing

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (restaurantsRef.current) {
      restaurantsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Navbar />
      <section className="min-h-screen bg-[#0a0a0a] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold text-center text-white mb-8 tracking-tight">
            All Restaurants
          </h1>

          <div className="flex items-center gap-3 mb-10 max-w-lg mx-auto bg-[#1a1a1a] p-2 rounded-2xl border border-white/10 shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-0"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-[#e21b70] text-white rounded-xl hover:bg-[#c2145d] transition-all font-bold shadow-md hover:shadow-lg"
            >
              Search
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#e21b70]" />
              <span className="ml-3 text-[#e21b70] font-medium text-lg">Loading...</span>
            </div>
          ) : (
            <div ref={restaurantsRef}>
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants && restaurants.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-[#111] rounded-3xl border border-white/5">
                    <p className="text-gray-300 text-xl font-medium">
                      No restaurants found.
                    </p>
                    <p className="text-gray-500 text-md mt-3">
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
                <div className="mt-14 flex justify-center items-center space-x-3">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      currentPage === 1
                        ? "bg-[#111] text-gray-600 cursor-not-allowed border border-transparent"
                        : "bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222] border border-white/10"
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-11 h-11 rounded-xl font-bold transition-all ${
                          currentPage === page
                            ? "bg-[#e21b70] text-white shadow-lg shadow-pink-500/20"
                            : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#222] border border-white/10"
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
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      currentPage === totalPages
                        ? "bg-[#111] text-gray-600 cursor-not-allowed border border-transparent"
                        : "bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222] border border-white/10"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Results summary */}
              {restaurants && restaurants.length > 0 && (
                <p className="text-center text-gray-500 mt-6 font-medium">
                  Showing page <span className="text-white">{currentPage}</span> of{" "}
                  <span className="text-white">{totalPages}</span>
                </p>
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
