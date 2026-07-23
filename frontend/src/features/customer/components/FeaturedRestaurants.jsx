import { Clock, Star, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useRestaurantStore } from "../store/useRestaurantStore";

const FeaturedRestaurants = ({ restaurants }) => {
  const toggleFavorite = useRestaurantStore((state) => state.toggleFavorite);

  const handleFavoriteClick = (e, restaurantId) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(restaurantId);
  };

  return (
  <div className="py-20 bg-[#111111] text-white">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-extrabold mb-2 text-white tracking-tight">Featured Restaurants</h2>
          <p className="text-xl text-gray-400 font-medium">
            Popular choices in your area
          </p>
        </div>
        <Link to="/restaurants" className="btn btn-outline border-[#e21b70] text-[#e21b70] hover:bg-[#e21b70] hover:border-[#e21b70] hover:text-white btn-lg rounded-full">
          View All Restaurants
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {restaurants && restaurants.length > 0 ? (
          restaurants.slice(0, 9).map((restaurant) => (
            <Link
              key={restaurant.restaurant_id}
              to={`/restaurant/${restaurant.restaurant_id}`}
              className="group"
            >
              <div className="card bg-[#1a1a1a] border border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 h-full overflow-hidden hover:border-white/20 group-hover:-translate-y-2 rounded-3xl">
                <figure className="relative overflow-hidden">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className={`w-full h-56 object-cover transition-transform duration-300 ${restaurant.is_open !== false ? 'group-hover:scale-110' : 'grayscale opacity-60'}`}
                  />
                  {restaurant.is_open === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[5]">
                      <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-lg border border-red-500/50 uppercase tracking-wide text-sm">
                        Currently Unavailable
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={(e) => handleFavoriteClick(e, restaurant.restaurant_id)}
                    className="absolute top-4 left-4 bg-black/40 backdrop-blur-md rounded-full p-2 hover:bg-black/60 hover:scale-110 transition-all z-10 border border-white/10"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${restaurant.is_favorite ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                  </button>
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 flex items-center gap-1 text-white shadow-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">
                      {restaurant.average_rating}
                    </span>
                  </div>
                </figure>
                <div className="card-body">
                  <h3 className="card-title text-xl font-bold mb-2 text-white group-hover:text-[#e21b70] transition-colors">
                    {restaurant.name}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {restaurant.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-400 text-sm font-medium">
                      <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 py-1.5 px-3 rounded-xl w-fit">
                        <Clock className="w-4 h-4 text-[#e21b70]" />
                        <span>
                          {restaurant.distance 
                            ? `${Math.round(15 + restaurant.distance * 4)}-${Math.round(25 + restaurant.distance * 4)} min` 
                            : `${15 + (restaurant.restaurant_id % 5) * 5}-${25 + (restaurant.restaurant_id % 5) * 5} min`}
                        </span>
                      </div>
                    </div>
                    <div className="badge bg-[#e21b70] border-none text-white font-semibold badge-lg shadow-md group-hover:scale-105 group-active:scale-95 group-hover:shadow-lg group-hover:shadow-[#e21b70]/30 transition-all">
                      Order Now
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 col-span-full bg-[#1a1a1a] rounded-3xl border border-white/5 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-3">No nearby restaurants found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              We couldn't find any restaurants within a 5km radius of your location, or you haven't set a delivery location yet.
            </p>
            <Link 
              to="/profile" 
              className="btn bg-[#e21b70] hover:bg-[#c2145d] text-white border-none rounded-full px-8 shadow-lg"
            >
              Set Delivery Location
            </Link>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default FeaturedRestaurants;

// import { Clock, Star } from "lucide-react";
// import { Link } from "react-router-dom";

// const FeaturedRestaurants = ({ restaurants }) => (
//   <div className="py-20 bg-base-200">
//     <div className="max-w-7xl mx-auto px-4">
//       <div className="flex justify-between items-center mb-12">
//         <div>
//           <h2 className="text-4xl font-bold mb-2">Featured Restaurants</h2>
//           <p className="text-xl text-base-content/70">
//             Popular choices in your area
//           </p>
//         </div>
//         <Link to="/restaurants" className="btn btn-outline btn-lg">
//           View All Restaurants
//         </Link>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//         {restaurants.map((restaurant) => (
//           <Link
//             key={restaurant.id}
//             to={`/restaurant/${restaurant.id}`}
//             className="group"
//           >
//             <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
//               <figure className="relative overflow-hidden">
//                 <img
//                   src={restaurant.image_url}
//                   alt={restaurant.name}
//                   className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
//                 />
//                 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
//                   <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
//                   <span className="font-semibold text-sm">
//                     {restaurant.average_rating}
//                   </span>
//                 </div>
//               </figure>
//               <div className="card-body">
//                 <h3 className="card-title text-xl">{restaurant.name}</h3>
//                 <p className="text-base-content/70 mb-3">
//                   {restaurant.category}
//                 </p>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2 text-sm">
//                     {/* <Clock className="w-4 h-4 text-primary" />
//                     <span>{restaurant.deliveryTime}</span> */}
//                   </div>
//                   <div className="badge badge-primary badge-lg">Order Now</div>
//                 </div>
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   </div>
// );

// export default FeaturedRestaurants;
