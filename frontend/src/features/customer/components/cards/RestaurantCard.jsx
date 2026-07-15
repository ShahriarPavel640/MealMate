import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { useRestaurantStore } from "../../store/useRestaurantStore";

const RestaurantCard = ({ restaurant }) => {
  const { restaurant_id, name, email, average_rating, phone, image_url, is_favorite, is_open } =
    restaurant;

  const navigate = useNavigate();
  const toggleFavorite = useRestaurantStore((state) => state.toggleFavorite);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(restaurant_id);
  };

  return (
    <Link to={`/restaurant/${restaurant_id}`} className="group">
      <div className="bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/5 shadow-xl hover:shadow-2xl hover:shadow-[#e21b70]/20 transition-all duration-300 group-hover:-translate-y-2 flex flex-col h-full">
        <figure className="relative h-56 overflow-hidden">
          <img
            src={image_url}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-700 ${is_open !== false ? 'group-hover:scale-110' : 'grayscale opacity-60'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent opacity-80" />
          
          {is_open === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-lg border border-red-500/50 uppercase tracking-wide text-sm z-10">
                Currently Unavailable
              </span>
            </div>
          )}
          
          <button 
            onClick={handleFavoriteClick}
            className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/10 shadow-lg hover:scale-110 transition-transform z-10"
          >
            <Heart className={`w-5 h-5 transition-colors ${is_favorite ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
          </button>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-white/10 shadow-lg">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-white text-sm">{average_rating}</span>
          </div>
        </figure>
        
        <div className="p-6 flex flex-col flex-grow relative">
          <h3 className="text-2xl font-bold text-white mb-4 line-clamp-1 group-hover:text-[#e21b70] transition-colors">{name}</h3>

          <div className="text-gray-400 text-sm space-y-2 mb-6 flex-grow">
            <p className="flex items-center gap-2">
              <span className="text-xl">📧</span> <span className="font-medium truncate">{email}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-xl">📞</span> <span className="font-medium">{phone}</span>
            </p>
          </div>

          <div className="inline-block bg-[#e21b70]/10 text-[#e21b70] border border-[#e21b70]/20 font-bold px-6 py-2.5 rounded-full text-center transition-all group-hover:bg-[#e21b70] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#e21b70]/30 group-active:scale-95">
            View Menu
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
