import React, { useEffect, useState } from "react";
import Navbar from "@/features/customer/components/skeleton/Navbar";
import { axiosInstance } from "@/lib/axios";
import { Loader2, Package, Calendar, Wallet, CheckCircle, Clock, MapPin, TrendingUp, Award, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const DeliveryHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/rider/data/history?page=${currentPage}&limit=10`);
        setHistory(res.data.history);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Error fetching delivery history:", err);
        toast.error("Failed to load delivery history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
          <div className="flex items-center space-x-3">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <span className="text-xl font-medium text-gray-700">Loading delivery history...</span>
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
          <button
            onClick={() => navigate('/rider')}
            className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium bg-gray-50 px-4 py-2 rounded-lg shadow-sm border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center mb-6">
            <Package className="size-8 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-800">Delivery History</h1>
          </div>
          
          </div>

        {/* Delivery History Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Clock className="size-6 mr-3 text-gray-600" />
            Recent Deliveries
          </h2>

          {history.length > 0 ? (
            <>
              <div className="space-y-6">
              {history.map((order, index) => (
                <div key={order.order_id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 text-white rounded-full p-2">
                        <Package className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Order #{order.order_id}</h3>
                        <div className="flex items-center mt-1">
                          <CheckCircle className="size-4 text-green-600 mr-1" />
                          <span className="text-sm text-green-600 font-medium">Delivered Successfully</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Completed
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <Wallet className="size-5 mr-2 text-green-600" />
                        <span className="font-medium">Total Amount:</span>
                        <span className="ml-2 text-lg font-bold text-green-600">Tk {order.total_amount}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <Calendar className="size-5 mr-2 text-blue-600" />
                        <span className="font-medium">Delivered At:</span>
                        <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {new Date(order.delivered_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <Package className="size-5 mr-2 text-indigo-600" />
                        <span className="font-medium">Restaurant:</span>
                        <span className="ml-2 text-md text-gray-800">{order.restaurant_name}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <MapPin className="size-5 mr-2 text-red-600" />
                        <span className="font-medium">Dropoff:</span>
                        <span className="ml-2 text-sm text-gray-600 line-clamp-1" title={order.dropoff_addr}>{order.dropoff_addr}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium">Customer:</span>
                        <span className="ml-2 text-sm text-gray-600">{order.customer_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order rank indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Award className="size-4 mr-1" />
                      Delivery #{history.length - index}
                    </div>
                    {order.delivery_time && (
                      <div className="text-sm text-gray-500">
                        <Clock className="size-4 inline mr-1" />
                        Delivery time: {order.delivery_time}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-600 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-16">
              <Package className="size-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Delivery History</h3>
              <p className="text-gray-500 text-lg">You haven't completed any deliveries yet.</p>
              <p className="text-gray-400 text-sm mt-2">Once you start delivering orders, they'll appear here.</p>
              <div className="mt-6">
                <button 
                  onClick={() => window.history.back()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Go Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        </div>
    </div>
  );
};

export default DeliveryHistoryPage;