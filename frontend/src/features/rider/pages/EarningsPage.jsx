import React, { useState, useEffect } from "react";
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
  ChevronDown,
  Download,
  Eye
} from "lucide-react";
import axios from "axios";

const RiderEarningsDashboard = () => {
  const [earningsData, setEarningsData] = useState({ weekly: [], monthly: [], peakHours: [] });
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('earnings');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const earningsRes = await axios.get('/api/rider/data/earnings', { withCredentials: true });
        const reviewsRes = await axios.get('/api/customer/review/my-reviews', { withCredentials: true });
        setEarningsData(earningsRes.data);
        setReviewsData(reviewsRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, change, icon: Icon, color, suffix = '' }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}{suffix}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            {/* <span className="text-sm text-green-600 font-medium">{change}% vs last period</span> */}
          </div>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
              <p className="text-gray-600">Track your performance and earnings</p>
            </div>
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Earnings (Weekly)"
            value={`${weeklyStats.totalEarnings.toFixed(2)}`}
            change="+12.5" // Placeholder
            icon={DollarSign}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            title="Orders Completed (Weekly)"
            value={weeklyStats.totalOrders}
            change="+8.3" // Placeholder
            icon={Package}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            title="Overall Average Rating"
            value={reviewsData.averageRating || 'N/A'}
            change="+2.1" // Placeholder
            icon={Star}
            color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          />
          <StatCard
            title="Hours Worked (Weekly)"
            value={weeklyStats.totalHours.toFixed(2)}
            change="+5.7" // Placeholder
            icon={Clock}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            suffix="h"
          />
        </div>

        {/* Main Charts Section */}
        <div className="space-y-6 mb-8">
          {/* Earnings Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Earnings Trend</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedMetric('earnings')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetric === 'earnings' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Earnings
                </button>
                <button
                  onClick={() => setSelectedMetric('orders')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetric === 'orders' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={earningsData.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#colorGradient)"
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Peak Hours Analysis</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={earningsData.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time_slot" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={earningsData.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Reviews</h3>
          <div className="space-y-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderEarningsDashboard;
