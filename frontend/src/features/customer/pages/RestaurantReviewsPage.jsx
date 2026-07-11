import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";

const RestaurantReviewsPage = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch restaurant details to get the name
        const restaurantRes = await axiosInstance.get(`/customer/getRestaurant/${restaurantId}`);
        setRestaurantName(restaurantRes.data.restaruntDetails.name);

        // Fetch reviews for the restaurant
        const reviewsRes = await axiosInstance.get(`/customer/review/restaurant/${restaurantId}`);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [restaurantId]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading reviews...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 text-gray-800">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Reviews for {restaurantName}</h1>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.review_id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-2">
                <h3 className="text-xl font-semibold text-pink-600">{review.user_name}</h3>
                <div className="ml-4 flex items-center">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`h-5 w-5 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-gray-600">{parseFloat(review.rating).toFixed(1)}</span>
                </div>
              </div>
              <p className="text-gray-700 mb-3">{review.comment}</p>
              <p className="text-sm text-gray-500">
                Reviewed on: {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No reviews yet for this restaurant.</p>
      )}
    </div>
  );
};

export default RestaurantReviewsPage;
