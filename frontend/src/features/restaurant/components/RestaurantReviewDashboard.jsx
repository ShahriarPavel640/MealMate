import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Card } from "@/features/restaurant/components/ui/card";
import { Star } from "lucide-react";

const RestaurantReviewDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/restaurant/reviews");
        setReviews(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Reviews</h1>
        <p className="text-gray-400">All customer reviews for your restaurant</p>
      </div>

      {/* Reviews */}
      {loading ? (
        <p className="text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400">No reviews found.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.review_id}
              className="bg-gray-800 border border-gray-700 p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-amber-500">
                  {review.user_name}
                </h3>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-500"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-400">
                    {parseFloat(review.rating).toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-gray-300 mb-2">{review.comment}</p>
              <p className="text-sm text-gray-500">
                Reviewed on {new Date(review.created_at).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantReviewDashboard;
