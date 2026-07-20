/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from "recharts";
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  Clock, 
  Calendar,
  Star,
  Target,
  Award,
  Wallet,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import RiderLayout from "@/features/rider/components/RiderLayout";

const RiderEarningsDashboard = () => {
  const [earningsData, setEarningsData] = useState({ weekly: [], monthly: [], peakHours: [] });
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [isFetchingReviews, setIsFetchingReviews] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const earningsRes = await axiosInstance.get('/rider/data/earnings');
        const reviewsRes = await axiosInstance.get('/rider/data/reviews?page=1&limit=10');
        setEarningsData(earningsRes.data);
        setReviewsData({
          reviews: reviewsRes.data.reviews,
          averageRating: reviewsRes.data.averageRating
        });
        setTotalReviewPages(reviewsRes.data.totalPages);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch data.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const loadMoreReviews = useCallback(async () => {
    if (isFetchingReviews || reviewsPage >= totalReviewPages) return;
    setIsFetchingReviews(true);
    try {
      const nextPage = reviewsPage + 1;
      const res = await axiosInstance.get(`/rider/data/reviews?page=${nextPage}&limit=10`);
      setReviewsData(prev => ({
        ...prev,
        reviews: [...prev.reviews, ...res.data.reviews]
      }));
      setReviewsPage(nextPage);
      setTotalReviewPages(res.data.totalPages);
    } catch (err) {
      console.error("Error loading more reviews:", err);
    } finally {
      setIsFetchingReviews(false);
    }
  }, [reviewsPage, totalReviewPages, isFetchingReviews]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      loadMoreReviews();
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value}{suffix}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-[#e21b70] mr-1" />
          </div>
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'earnings' ? 'Tk ' : ''}{entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const weeklyStats = earningsData.weekly.reduce((acc, day) => {
    acc.totalEarnings += parseFloat(day.earnings);
    acc.totalOrders += parseInt(day.orders, 10);
    acc.totalHours += parseFloat(day.hours);
    return acc;
  }, { totalEarnings: 0, totalOrders: 0, totalHours: 0 });

  return (
    <RiderLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Performance Dashboard</h1>
              <p className="text-gray-500 font-medium">Track your performance and earnings</p>
            </div>
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Total Earnings (Weekly)"
            value={`Tk ${weeklyStats.totalEarnings.toFixed(2)}`}
            change="+12.5" // Placeholder
            icon={Wallet}
            color="bg-gradient-to-br from-[#e21b70] to-[#c21760]"
          />
          <StatCard
            title="Orders Completed (Weekly)"
            value={weeklyStats.totalOrders}
            change="+8.3" // Placeholder
            icon={Package}
            color="bg-gradient-to-br from-pink-500 to-rose-500"
          />
          <StatCard
            title="Overall Average Rating"
            value={reviewsData.averageRating || 'N/A'}
            change="+2.1" // Placeholder
            icon={Star}
            color="bg-gradient-to-br from-orange-400 to-orange-500"
          />
          <StatCard
            title="Hours Worked (Weekly)"
            value={weeklyStats.totalHours.toFixed(2)}
            change="+5.7" // Placeholder
            icon={Clock}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            suffix="h"
          />
        </motion.div>

        {/* Main Charts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 mb-8"
        >
          {/* Earnings Trend */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Weekly Earnings Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={earningsData.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#e21b70"
                  strokeWidth={3}
                  fill="url(#colorGradient)"
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e21b70" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e21b70" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours Analysis */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Peak Hours Analysis</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={earningsData.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time_slot" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="#c21760" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Performance */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={earningsData.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#e21b70"
                  strokeWidth={3}
                  dot={{ fill: '#e21b70', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Reviews */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Reviews</h3>
          <div 
            className="space-y-4 overflow-y-auto pr-2" 
            style={{ maxHeight: '400px' }}
            onScroll={handleScroll}
          >
            {reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">{review.user_name}</p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No reviews yet.</p>
            )}
            
            {isFetchingReviews && (
              <div className="flex justify-center py-4">
                <Loader2 className="size-6 animate-spin text-blue-600" />
              </div>
            )}
            
            {!isFetchingReviews && reviewsPage >= totalReviewPages && reviewsData.reviews.length > 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No more reviews to load.</p>
            )}
          </div>
        </motion.div>
      </div>
    </RiderLayout>
  );
};

export default RiderEarningsDashboard;
