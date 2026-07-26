import React, { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/features/restaurant/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/features/restaurant/components/ui/dialog";
import RatingModal from "@/features/customer/components/RatingModal";
import LiveTrackingModal from "@/features/customer/components/LiveTrackingModal";

const OrderHistoryPage = () => {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null); // { type: 'restaurant' | 'rider', id: order.restaurant_id | order.rider_id, orderId: order.order_id }
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tracking Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderData, setTrackingOrderData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get('/customer/order');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
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
          orders.map((order) => (
            <div key={order.order_id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-pink-600">{order.restaurant_name}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-700">Order ID: {order.order_id}</p>
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
                <p className="text-lg font-bold text-gray-900">Tk {order.total_amount}</p>
              </div>

              {order.status === 'delivered' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRatingTarget({ type: 'restaurant', id: order.restaurant_id, orderId: order.order_id });
                      setIsRatingModalOpen(true);
                    }}
                    disabled={order.has_restaurant_review}
                  >
                    {order.has_restaurant_review ? 'Restaurant Rated' : 'Rate Restaurant'}
                  </Button>
                  {order.rider_id && ( // Only show if a rider was assigned
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRatingTarget({ type: 'rider', id: order.rider_id, orderId: order.order_id });
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
                    onClick={() => navigate(`/chat/${order.order_id}`)}
                  >
                    Chat with Rider
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                    onClick={() => {
                      setTrackingOrderData({
                        orderId: order.order_id,
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
          ))
        ) : (
          <p className="text-gray-600">You have no orders yet.</p>
        )}
      </div>

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