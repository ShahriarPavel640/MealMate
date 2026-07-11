import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Phone } from "lucide-react";

const RestaurantCard = ({ restaurant }) => {
  const { restaurant_id, name, email, average_rating, phone, image_url } =
    restaurant;

  const navigate = useNavigate();
  // const handleCardClick = () => {
  //   navigate(`/restaurant/${restaurant_id}`);
  // };

  return (
    <Link to={`/restaurant/${restaurant_id}`} className="group">
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
        <figure className="relative overflow-hidden">
          <img
            src={image_url}
            alt={name}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4 bg-gray-500/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-sm">{average_rating}</span>
          </div>
        </figure>
        <div className="card-body">
          <h3 className="card-title text-xl">{name}</h3>

          <div className="text-base-content/70 text-sm space-y-1 mb-3">
            <p className="truncate">
              📧 <span className="font-medium">{email}</span>
            </p>
            <p>
              📞 <span className="font-medium">{phone}</span>
            </p>
          </div>

          <div className="badge badge-primary badge-lg self-start">
            View Menu
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
