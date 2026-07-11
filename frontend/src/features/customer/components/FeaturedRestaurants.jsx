import { Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";

const FeaturedRestaurants = ({ restaurants }) => (
  <div className="py-20 bg-base-200">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-bold mb-2">Featured Restaurants</h2>
          <p className="text-xl text-base-content/70">
            Popular choices in your area
          </p>
        </div>
        <Link to="/restaurants" className="btn btn-outline btn-lg">
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
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                <figure className="relative overflow-hidden">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">
                      {restaurant.average_rating}
                    </span>
                  </div>
                </figure>
                <div className="card-body">
                  <h3 className="card-title text-xl">{restaurant.name}</h3>
                  <p className="text-base-content/70 mb-3">
                    {restaurant.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {/* <Clock className="w-4 h-4 text-primary" />
                      <span>{restaurant.deliveryTime}</span> */}
                    </div>
                    <div className="badge badge-primary badge-lg">
                      Order Now
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-gray-400 py-10 col-span-full">
            No restaurants available.
          </div>
        )}
      </div>
    </div>
  </div>
);

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
