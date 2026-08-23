import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import { Star, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";
import ReactMarkdown from 'react-markdown';

const RestaurantReviewsPage = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  
  const [reviews, setReviews] = useState([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef();
  const lastReviewElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Initial load: fetch restaurant details, AI summary, and first page of reviews
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const restaurantRes = await axiosInstance.get(`/customer/getRestaurant/${restaurantId}`);
        setRestaurantName(restaurantRes.data.restaruntDetails.name);

        axiosInstance.get(`/ai/summarize-reviews/${restaurantId}`)
          .then(res => {
            setAiSummary(res.data.summary);
            setLoadingSummary(false);
          })
          .catch(err => {
            console.error('Error fetching AI summary:', err);
            setLoadingSummary(false);
          });
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, [restaurantId]);

  // Fetch reviews when page changes
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        const reviewsRes = await axiosInstance.get(`/customer/review/restaurant/${restaurantId}?page=${page}&limit=10`);
        const fetchedReviews = reviewsRes.data.reviews || reviewsRes.data;
        const pagination = reviewsRes.data.pagination;

        setReviews(prev => page === 1 ? fetchedReviews : [...prev, ...fetchedReviews]);
        
        if (pagination) {
          setHasMore(page < pagination.totalPages);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        if (page === 1) setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchReviews();
  }, [restaurantId, page]);

  if (loading) {
    return <div className="container mx-auto p-4 flex items-center justify-center min-h-screen text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div>;
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

      {/* AI Summary Section */}
      <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-white rounded-full shadow-sm mr-3">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-indigo-900">AI Review Summary</h2>
        </div>
        {loadingSummary ? (
          <div className="flex items-center text-indigo-400">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating summary...
          </div>
        ) : (
          <div className="prose prose-indigo prose-sm max-w-none text-indigo-800">
             <ReactMarkdown>{aiSummary || "No summary available."}</ReactMarkdown>
          </div>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review, index) => {
            const isLast = index === reviews.length - 1;
            return (
              <div 
                ref={isLast ? lastReviewElementRef : null}
                key={`${review.review_id || index}-${review.created_at}`} 
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex items-center mb-2">
                  <h3 className="text-xl font-semibold text-pink-600">{review.user_name}</h3>
                  <div className="ml-4 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
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
            );
          })}
          {loadingMore && (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          )}
          {!hasMore && reviews.length > 0 && (
            <div className="text-center text-gray-500 p-4">
              No more reviews to load.
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600">No reviews yet for this restaurant.</p>
      )}
    </div>
  );
};

export default RestaurantReviewsPage;
