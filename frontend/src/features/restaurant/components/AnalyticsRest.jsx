import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/restaurant/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/features/restaurant/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";

const AnalyticsRest = () => {
  const [dailyRevenueData, setDailyRevenueData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [weeklyTrendsData, setWeeklyTrendeData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [weeklyRevenueVal, setWeeklyRevenueVal] = useState({
    last_week: 0,
    last_two_week: 0,
  });
  const [totalOrderLastWeekVal, setTotalOrderLastWeekVal] = useState({
    last_week: 0,
    second_last_week: 0,
  });
  const [newCustomerVal, setNewCustomerVal] = useState({
    last_week: 0,
    second_last_week: 0,
  });
  const [rating, setRating] = useState(0);

  const getDailyRevenue = async () => {
    try {
      const response = await axiosInstance.get(
        "restaurant/stats/daily_revenue"
      );
      return response.data;
    } catch (err) {
      console.error("Error fetching recent orders:", err.message);
      return [];
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [revenueRes, orderRes, customerRes, restData] = await Promise.all(
          [
            axiosInstance.get("/restaurant/stats/last_two_week_revenue"),
            axiosInstance.get("/restaurant/stats/last_two_week_order_count"),
            axiosInstance.get("/restaurant/stats/last_two_week_new_customer"),
            axiosInstance.get("/restaurant/get_restaurant_profile"),
          ]
        );
        console.log("restaurant data: ", restData.data);
        setWeeklyRevenueVal(revenueRes.data);
        setTotalOrderLastWeekVal(orderRes.data);
        setNewCustomerVal(customerRes.data);
        setRating(restData.data.rating);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchDailyRevenue = async () => {
      const res = await getDailyRevenue();
      setDailyRevenueData(res);
    };

    fetchDailyRevenue();
  }, []);

  const getTopItems = async () => {
    try {
      const response = await axiosInstance.get(
        "restaurant/stats/top_selling_items"
      );
      return response.data;
    } catch (err) {
      console.error("Error fetching top items:", err.message);
      return [];
    }
  };

  useEffect(() => {
    const fetchTopItems = async () => {
      const data = await getTopItems();
      setTopItems(data);
    };

    fetchTopItems();
  }, []);

  const getWeeklyRevenue = async () => {
    try {
      const response = await axiosInstance.get(
        "restaurant/stats/monthly_revenue"
      );
      return response.data;
    } catch (err) {
      console.error("Error fetching weekly revenue:", err.message);
      return [];
    }
  };

  useEffect(() => {
    const fetchWeeklyRevenue = async () => {
      const data = await getWeeklyRevenue();
      setWeeklyTrendeData(data);
    };

    fetchWeeklyRevenue();
  }, []);

  const getCategoryData = async () => {
    try {
      const response = await axiosInstance.get(
        "restaurant/stats/category_wise_sell"
      );
      return response.data;
    } catch (err) {
      console.error("Error in fething categorywise sell data");
      return [];
    }
  };

  useEffect(() => {
    const fetchCategoryData = async () => {
      const data = await getCategoryData();
      setCategoryData(data);
    };
    fetchCategoryData();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
        <p className="text-gray-400">
          Track your restaurant's performance and growth
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border border-gray-700 text-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Weekly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>

          <CardContent>
            {(() => {
              const lastWeek = parseFloat(weeklyRevenueVal?.last_week ?? 0);
              const prevWeek = parseFloat(weeklyRevenueVal?.last_two_week ?? 0);

              return (
                <>
                  <div className="text-2xl font-bold text-white">
                    ৳ {lastWeek.toFixed(2)}
                  </div>

                  <div className="flex items-center space-x-1 mt-1">
                    {prevWeek === 0 && lastWeek === 0 ? (
                      <>
                        <span className="text-sm text-gray-400">
                          No revenue in the last two weeks
                        </span>
                        {console.log("1st")}
                      </>
                    ) : prevWeek === 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">+100%</span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                        {console.log("2nd")}
                      </>
                    ) : lastWeek >= prevWeek ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">
                          +{" "}
                          {(((lastWeek - prevWeek) / prevWeek) * 100).toFixed(
                            2
                          )}
                          %
                        </span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                        {console.log("3rd")}
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-400">
                          -{" "}
                          {(((prevWeek - lastWeek) / prevWeek) * 100).toFixed(
                            2
                          )}
                          %
                        </span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                        {console.log("4th")}
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 text-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-400" />
          </CardHeader>

          {/* <CardContent>
            <div className="text-2xl font-bold text-white">309</div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">+8.1%</span>
              <span className="text-sm text-gray-400">vs last week</span>
            </div>
          </CardContent> */}
          <CardContent>
            {(() => {
              const lastWeek = parseFloat(
                totalOrderLastWeekVal?.last_week ?? 0
              );
              const prevWeek = parseFloat(
                totalOrderLastWeekVal?.second_last_week ?? 0
              );

              return (
                <>
                  <div className="text-2xl font-bold text-white">
                    {lastWeek}
                  </div>

                  <div className="flex items-center space-x-1 mt-1">
                    {lastWeek === 0 && prevWeek === 0 ? (
                      <span className="text-sm text-gray-400">
                        No orders in the last two weeks
                      </span>
                    ) : prevWeek === 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">+100%</span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                      </>
                    ) : lastWeek >= prevWeek ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">
                          +{" "}
                          {(((lastWeek - prevWeek) / prevWeek) * 100).toFixed(
                            2
                          )}
                          %
                        </span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-400">
                          -{" "}
                          {(((prevWeek - lastWeek) / prevWeek) * 100).toFixed(
                            2
                          )}
                          %
                        </span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 text-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              New Customers
            </CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>

          {/* <CardContent>
            <div className="text-2xl font-bold text-white">47</div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">-2.3%</span>
              <span className="text-sm text-gray-400">vs last week</span>
            </div>
          </CardContent> */}
          <CardContent>
            {(() => {
              const lastWeek = parseFloat(newCustomerVal?.last_week ?? 0);
              const prevWeek = parseFloat(
                newCustomerVal?.second_last_week ?? 0
              );
              const isIncrease = lastWeek > prevWeek;

              const percentChange =
                prevWeek === 0
                  ? lastWeek === 0
                    ? 0
                    : 100
                  : Math.abs(((lastWeek - prevWeek) / prevWeek) * 100);

              return (
                <>
                  <div className="text-2xl font-bold text-white">
                    {lastWeek}
                  </div>

                  <div className="flex items-center space-x-1 mt-1">
                    {lastWeek === 0 && prevWeek === 0 ? (
                      <span className="text-sm text-gray-400">
                        No new customers in the last two weeks
                      </span>
                    ) : isIncrease ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">
                          +{percentChange.toFixed(2)}%
                        </span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                      </>
                    ) : lastWeek < prevWeek ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-400">
                          -{percentChange.toFixed(2)}%
                        </span>
                        <span className="text-sm text-gray-400">
                          vs last week
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">
                        No change from last week
                      </span>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 text-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Avg Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{rating}</div>
            {/* <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">+0.2</span>
              <span className="text-sm text-gray-400">vs last week</span>
            </div> */}
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Charts */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="revenue"
            className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500"
          >
            Revenue Trends
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500"
          >
            Order Analytics
          </TabsTrigger>
          <TabsTrigger
            value="menu"
            className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500"
          >
            Menu Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Daily Revenue</CardTitle>
                <CardDescription className="text-gray-400">
                  Revenue trends for the past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                    <XAxis dataKey="day" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        color: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#FF6B6B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Weekly Growth</CardTitle>
                <CardDescription className="text-gray-400">
                  Revenue growth over the past month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                    <XAxis dataKey="week" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#FF6B6B"
                      strokeWidth={3}
                      dot={{ fill: "#FF6B6B", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Daily Orders</CardTitle>
                <CardDescription className="text-gray-400">
                  Number of orders per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                    <XAxis dataKey="day" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        color: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="orders"
                      fill="#4ECDC4"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Order Categories</CardTitle>
                <CardDescription className="text-gray-400">
                  Distribution of orders by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          <Card className="bg-gray-800 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Items</CardTitle>
              <CardDescription className="text-gray-400">
                Your best-selling menu items this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-sm text-gray-400">
                          {item.orders} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{item.revenue}</p>
                      <p className="text-sm text-gray-400">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsRest;
