import React, { useEffect, useState, useRef } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/features/restaurant/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation } from "lucide-react";
import RatingModal, { RatingTarget } from "@/features/customer/components/RatingModal";
import LiveTrackingModal from "@/features/customer/components/LiveTrackingModal";
import { Order } from "@/types/models";

interface ExtendedOrder extends Omit<Partial<Order>, 'items'> {
  restaurant_name?: string;
  total_amount?: number | string;
  has_restaurant_review?: boolean;
  has_rider_review?: boolean;
  dropoff_latitude?: string;
  dropoff_longitude?: string;
  items?: {
    menu_item_name?: string;
    quantity: number;
    price: number;
  }[];
}

const OrderHistoryPage: React.FC = () => {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<RatingTarget | null>(null);
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Tracking Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderData, setTrackingOrderData] = useState<{
    orderId: number | string;
    dropoffLocation?: { lat: number; lng: number } | null;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (page === 1) setLoading(true);
        else setIsLoadingMore(true);

        const res = await axiosInstance.get(`/customer/order?page=${page}&limit=10`);
        const newOrders: ExtendedOrder[] = res.data.data;
        const totalPages = res.data.pagination.totalPages;

        if (page === 1) {
          setOrders(newOrders);
        } else {
          setOrders(prev => [...prev, ...newOrders]);
        }

        if (page >= totalPages || newOrders.length === 0) {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchOrders();
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !isLoadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, isLoadingMore]);

  if (loading && page === 1) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error && page === 1) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 text-gray-800">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-2">
          <ArrowLeft />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
      </div>

      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map((order) => {
            const orderId = order.order_id || 0;
            return (
              <div key={orderId} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-pink-600">{order.restaurant_name}</h2>
                  <span className="text-sm text-gray-500">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-700">Order ID: {orderId}</p>
                    <p className="text-gray-700">
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          order.status === 'delivered'
                            ? 'text-green-600'
                            : order.status === 'cancelled'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">Tk {order.total_amount || order.total_price}</p>
                </div>

                {order.status === 'delivered' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRatingTarget({ type: 'restaurant', id: order.restaurant_id, orderId: orderId });
                        setIsRatingModalOpen(true);
                      }}
                      disabled={order.has_restaurant_review}
                    >
                      {order.has_restaurant_review ? 'Restaurant Rated' : 'Rate Restaurant'}
                    </Button>
                    {order.rider_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRatingTarget({ type: 'rider', id: order.rider_id, orderId: orderId });
                          setIsRatingModalOpen(true);
                        }}
                        disabled={order.has_rider_review}
                      >
                        {order.has_rider_review ? 'Rider Rated' : 'Rate Rider'}
                      </Button>
                    )}
                  </div>
                )}
                {order.status === 'out_for_delivery' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/chat/${orderId}`)}
                    >
                      Chat with Rider
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                      onClick={() => {
                        setTrackingOrderData({
                          orderId: orderId,
                          dropoffLocation: order.dropoff_latitude && order.dropoff_longitude 
                            ? { lat: parseFloat(order.dropoff_latitude), lng: parseFloat(order.dropoff_longitude) }
                            : null
                        });
                        setIsTrackingModalOpen(true);
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Track Live
                    </Button>
                  </div>
                )}

                <div className="mt-4 border-t pt-4">
                  <h3 className="text-md font-semibold mb-2">Items:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {order.items &&
                      order.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-600">
                          {item.menu_item_name} (x{item.quantity}) - Tk {item.price}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-600">You have no orders yet.</p>
        )}
      </div>

      {hasMore && orders.length > 0 && (
        <div ref={observerTarget} className="flex justify-center py-6">
          {isLoadingMore ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      )}

      {ratingTarget && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          target={ratingTarget}
          onReviewSubmitted={(type) => {
            setOrders((prevOrders) =>
              prevOrders.map((order) => {
                if (order.order_id === ratingTarget.orderId) {
                  return {
                    ...order,
                    has_restaurant_review:
                      type === "restaurant"
                        ? true
                        : order.has_restaurant_review,
                    has_rider_review:
                      type === "rider" ? true : order.has_rider_review,
                  };
                }
                return order;
              })
            );
            setIsRatingModalOpen(false);
          }}
        />
      )}

      {isTrackingModalOpen && trackingOrderData && (
        <LiveTrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => {
            setIsTrackingModalOpen(false);
            setTrackingOrderData(null);
          }}
          orderId={trackingOrderData.orderId}
          dropoffLocation={trackingOrderData.dropoffLocation}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;
