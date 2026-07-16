import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import Navbar from "@/features/customer/components/skeleton/Navbar";
import { Loader2, Package, MapPin, User, Phone, Mail, DollarSign, Clock, ArrowLeft, ExternalLink, Store, Navigation } from "lucide-react";
import toast from "react-hot-toast";

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axiosInstance.get(`/rider/data/orders/${orderId}`);
        setOrder(res.data.order);
      } catch (err) {
        console.error("Error fetching order details:", err);
        toast.error("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
          <div className="flex items-center space-x-3">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <span className="text-xl font-medium text-gray-700">Loading order details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
            <Package className="size-20 text-red-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-red-600 mb-4">Order Not Found</h1>
            <p className="text-gray-600 text-lg mb-6">The order details you're looking for could not be found.</p>
            <Link
              to="/rider"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              <ArrowLeft className="size-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Package className="size-8 text-blue-600 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Order Details</h1>
                <p className="text-xl text-gray-600">Order #{order.order_id}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'preparing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                <Clock className="size-4 inline mr-2" />
                {order.status}
              </div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                Tk {order.total_amount}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Restaurant Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <div className="flex items-center mb-6">
              <Store className="size-6 text-orange-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Restaurant Information</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-600 text-white rounded-full p-2 mr-4">
                    <Store className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{order.restaurant_name}</h3>
                    <p className="text-gray-600 text-sm">Restaurant Partner</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Phone className="size-5 mr-3 text-blue-600" />
                    <span className="font-medium mr-2">Phone:</span>
                    <a 
                      href={`tel:${order.restaurant_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.restaurant_phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Mail className="size-5 mr-3 text-green-600" />
                    <span className="font-medium mr-2">Email:</span>
                    <a 
                      href={`mailto:${order.restaurant_email}`}
                      className="text-green-600 hover:underline"
                    >
                      {order.restaurant_email}
                    </a>
                  </div>
                </div>
              </div>

              {order.pickup_address && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <MapPin className="size-5 text-red-600 mr-2" />
                    <span className="font-medium text-gray-800">Pickup Address:</span>
                  </div>
                  <p className="text-gray-700 text-sm bg-white p-3 rounded-lg">
                    {order.pickup_address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <div className="flex items-center mb-6">
              <User className="size-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Customer Information</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 text-white rounded-full p-2 mr-4">
                    <User className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{order.customer_name}</h3>
                    <p className="text-gray-600 text-sm">Customer</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Phone className="size-5 mr-3 text-blue-600" />
                    <span className="font-medium mr-2">Phone:</span>
                    <a 
                      href={`tel:${order.customer_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.customer_phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <MapPin className="size-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-800">Drop-off Address:</span>
                </div>
                <p className="text-gray-700 bg-white p-4 rounded-lg mb-4 border border-green-100">
                  {order.dropoff_addr}
                </p>
                
                {order.dropoff_latitude && order.dropoff_longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.dropoff_latitude},${order.dropoff_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    <Navigation className="size-5 mr-2" />
                    Navigate to Location
                    <ExternalLink className="size-4 ml-2" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Section (if available) */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mt-8">
            <div className="flex items-center mb-6">
              <Package className="size-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Order Items</h2>
            </div>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-purple-600 text-white rounded-full p-2 mr-4">
                        <Package className="size-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">Tk {item.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl shadow-lg border border-blue-200 p-8 mt-8">
          <div className="flex items-center mb-6">
            <DollarSign className="size-6 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Order Summary</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-2xl text-green-600">Tk {order.total_amount}</span>
                </div>
                {order.delivery_fee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="text-gray-800">Tk {order.delivery_fee}</span>
                  </div>
                )}
                {order.tax && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-800">Tk {order.tax}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Timeline</h3>
              <div className="space-y-2 text-sm">
                {order.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Placed:</span>
                    <span className="text-gray-800">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                )}
                {order.accepted_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accepted:</span>
                    <span className="text-gray-800">{new Date(order.accepted_at).toLocaleString()}</span>
                  </div>
                )}
                {order.delivered_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivered:</span>
                    <span className="text-gray-800">{new Date(order.delivered_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8">
          <Link
            to="/rider"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center"
          >
            <ArrowLeft className="size-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;