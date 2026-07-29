import { useEffect, useState, useRef } from "react";
import { axiosInstance } from "@/lib/axios";
import { Card } from "@/features/restaurant/components/ui/card";
import { Button } from "@/features/restaurant/components/ui/button";
import { Star } from "lucide-react";

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  let pages = [];
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (currentPage <= 4) {
      pages = [1, 2, 3, 4, 5, "...", totalPages];
    } else if (currentPage >= totalPages - 3) {
      pages = [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
    }
  }

  return (
    <div className="mt-8 flex justify-center items-center space-x-2 flex-wrap gap-y-2">
      <Button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        variant="outline"
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          currentPage === 1
            ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600"
            : "bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600"
        }`}
      >
        Previous
      </Button>
      {pages.map((page, index) => (
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="text-gray-400 px-2">...</span>
        ) : (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            variant={currentPage === page ? "default" : "outline"}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              currentPage === page
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600"
            }`}
          >
            {page}
          </Button>
        )
      ))}
      <Button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        variant="outline"
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          currentPage === totalPages
            ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600"
            : "bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600"
        }`}
      >
        Next
      </Button>
    </div>
  );
}

const RestaurantReviewDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const topRef = useRef(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/restaurant/reviews?page=${currentPage}&limit=${itemsPerPage}`);
        setReviews(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.totalItems);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [currentPage]);

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white space-y-6" ref={topRef}>
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
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              if (topRef.current) {
                topRef.current.scrollIntoView({ behavior: "smooth" });
              }
            }}
          />
          
          {reviews.length > 0 && (
            <div className="mt-6 text-center text-gray-400 text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} reviews
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantReviewDashboard;
