import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Clock, MapPin, Phone, User } from "lucide-react";
import socketService from "@/services/socketService";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import axios from "axios";
import toast from "react-hot-toast";

// --- Helper Functions ---

function getStatusColor(status) {
  switch (status) {
    case "pending_restaurant_acceptance":
      return "bg-blue-100 text-blue-800";
    case "preparing":
      return "bg-orange-100 text-orange-800";
    case "ready_for_pickup":
      return "bg-green-100 text-green-800";
    case "out_for_delivery":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-gray-100 text-gray-800";
    case "restaurant_rejected":
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'

function getNextStatus(currentStatus) {
  switch (currentStatus) {
    case "pending_restaurant_acceptance":
      return "preparing";
    case "preparing":
      return "ready_for_pickup";
    default:
      return currentStatus;
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "pending_restaurant_acceptance":
      return "Accept Order";
    case "preparing":
      return "Mark Ready for Pickup";
    case "ready_for_pickup":
      return "Awaiting Rider Pickup";
    case "out_for_delivery":
      return "Out for Delivery";
    default:
      return "Update Status";
  }
}

// --- OrderCard Component ---

function OrderCard({ order, onUpdateStatus, onRejectOrder }) {
  const showActionButtons = ![
    "delivered",
    "restaurant_rejected",
    "cancelled",
  ].includes(order.status);

  return (
    <Card className="hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 bg-gray-800 text-gray-100 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg text-gray-300">
                Order #{order.order_id}
              </CardTitle>
              <Badge className={getStatusColor(order.status)}>
                {order.status ? order.status.replace(/_/g, " ") : "N/A"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(order.created_at).toLocaleTimeString()}
              </div>
              {order.rider_name && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {order.rider_name} (Rider)
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-purple-400">
              Tk {parseFloat(order.total_amount).toFixed(2)}
            </p>
            <p className="text-sm text-gray-400">
              {order.payment_method || "N/A"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-200">
                {order.customer_name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {order.customer_phone}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {order.dropoff_addr}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-300">Order Items:</h4>
            {order.items &&
              order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-gray-200"
                >
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>
                    Tk {(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {order.special_instructions && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mt-4">
            <h4 className="text-yellow-500 font-semibold text-sm mb-1">Special Instructions:</h4>
            <p className="text-gray-300 text-sm">{order.special_instructions}</p>
          </div>
        )}

        {showActionButtons && (
          <div className="flex space-x-2 pt-4 border-t border-gray-700">
            <Button
              onClick={() => {
                const nextStatus = getNextStatus(order.status);
                onUpdateStatus(order.order_id, nextStatus);
              }}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 active:scale-95 transition-all text-white shadow-md"
              disabled={order.status === "ready_for_pickup"}
            >
              {getStatusLabel(order.status)}
            </Button>
            {order.status === "pending_restaurant_acceptance" && (
              <Button
                variant="outline"
                onClick={() => onRejectOrder(order.order_id)}
                className="border-gray-600 text-gray-200 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all"
              >
                Reject Order
              </Button>
            )}
            <a href={`tel:${order.customer_phone}`} className="inline-block">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-200 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50 transition-all h-full"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Pagination Component ---
function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Determine which pages to show
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

// --- OrderManagement Component ---

function OrderManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [orderList, setOrderList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5; // Display 5 orders per page
  const ordersRef = useRef(null);
  const { authRestaurant: restaurant } = restaurantAuthStore();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/restaurant/orders?status=${activeTab}&page=${currentPage}&limit=${itemsPerPage}`
      );
      setOrderList(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrderList([]);
    }
  }, [activeTab, currentPage, itemsPerPage]);

  const updateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      setOrderList((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        )
      );
      try {
        await axios.put(`/api/restaurant/orders/${orderId}/status`, {
          status: newStatus,
        });
      } catch (error) {
        console.error("Error updating order status:", error);
        fetchOrders();
        toast.error("Failed to update order status. Please try again.");
      }
    },
    [restaurant, fetchOrders]
  );

  const rejectOrder = useCallback(
    async (orderId) => {
      setOrderList((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId
            ? { ...order, status: "restaurant_rejected" }
            : order
        )
      );
      try {
        await axios.put(`/api/restaurant/orders/${orderId}/status`, {
          status: "restaurant_rejected",
        });
      } catch (error) {
        console.error("Error rejecting order:", error);
        fetchOrders();
        toast.error("Failed to reject order. Please try again.");
      }
    },
    [fetchOrders]
  );

  // --- Socket Event Handlers ---
  const handleNewOrder = useCallback(
    (newOrder) => {
      if (activeTab === "all" || activeTab === "pending_restaurant_acceptance") {
        setOrderList((prevOrders) => {
          const newArray = [newOrder, ...prevOrders];
          return newArray.slice(0, itemsPerPage);
        });
      }
      toast.success(
        `New Order Received! Order #${newOrder.order_id} from ${
          newOrder.customer_name
        } for Tk ${parseFloat(newOrder.total_amount).toFixed(2)}`,
        { duration: 5000, icon: '🍽️' }
      );
    },
    [activeTab, itemsPerPage]
  );

  const handleOrderStatusUpdated = useCallback((updatedOrder) => {
    setOrderList((prevOrders) =>
      prevOrders.map((order) =>
        order.order_id === updatedOrder.order_id
          ? { ...order, ...updatedOrder }
          : order
      )
    );
  }, []);

  const handleOrderAccepted = useCallback(({ orderId, riderProfile }) => {
    setOrderList((prevOrders) =>
      prevOrders.map((order) =>
        order.order_id === orderId
          ? {
              ...order,
              rider_name: riderProfile.name,
              rider_phone: riderProfile.phone_number,
              status: "out_for_delivery",
            }
          : order
      )
    );
  }, []);

  useEffect(() => {
    if (restaurant && restaurant.restaurant_id) {
      // Join the correct room for this restaurant to receive notifications
      if (socketService.socket) {
        socketService.socket.emit(
          "join_room",
          `restaurant_${restaurant.restaurant_id}`
        );
      }
      socketService.on("new_order", handleNewOrder);
      socketService.on("order_status_updated", handleOrderStatusUpdated);
      socketService.on("order_accepted", handleOrderAccepted);
      fetchOrders();
    }
    return () => {
      if (restaurant && restaurant.restaurant_id) {
        socketService.off("new_order", handleNewOrder);
        socketService.off("order_status_updated", handleOrderStatusUpdated);
        socketService.off("order_accepted", handleOrderAccepted);
      }
    };
  }, [
    restaurant,
    fetchOrders,
    handleNewOrder,
    handleOrderStatusUpdated,
    handleOrderAccepted,
  ]);

  // Pagination logic handled by server

  // 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
  const statuses = [
    "all",
    "pending_restaurant_acceptance",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "restaurant_rejected",
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-gray-400">Track and manage incoming orders</p>
      </div>

      {/* Tabs for Order Filtering */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => { 
          setActiveTab(v); 
          setCurrentPage(1); 
        }} 
        className="w-full"
      >
        <TabsList className="flex flex-wrap justify-center bg-gray-800 border border-gray-700 h-auto gap-2 p-2">
          {statuses.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600"
            >
              {tab === "all"
                ? "All Orders"
                : tab.replace(/_/g, " ").charAt(0).toUpperCase() +
                  tab.replace(/_/g, " ").slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          <div ref={ordersRef}>
            {orderList.length > 0 ? (
              <>
                <div className="space-y-4">
                  {orderList.map((order) => (
                    <OrderCard
                      key={order.order_id}
                      order={order}
                      onUpdateStatus={updateOrderStatus}
                      onRejectOrder={rejectOrder}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    if (ordersRef.current) {
                      ordersRef.current.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                />

                {/* Results summary */}
                <div className="mt-6 text-center text-gray-400 text-sm">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} orders
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No orders in this category.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OrderManagement;


// import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// import { Button } from "./ui/button";
// import { Badge } from "./ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
// import { Clock, MapPin, Phone, User } from "lucide-react";
// import socketService from "@/services/socketService";
// import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
// import axios from "axios";
// import { toast } from "@/hooks/use-toast";

// // --- Helper Functions ---

// function getStatusColor(status) {
//   switch (status) {
//     case "pending_restaurant_acceptance":
//       return "bg-blue-100 text-blue-800";
//     case "preparing":
//       return "bg-orange-100 text-orange-800";
//     case "ready_for_pickup":
//       return "bg-green-100 text-green-800";
//     case "out_for_delivery":
//       return "bg-purple-100 text-purple-800";
//     case "delivered":
//       return "bg-gray-100 text-gray-800";
//     case "restaurant_rejected":
//     case "cancelled":
//       return "bg-red-100 text-red-800";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// }

// // 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'

// function getNextStatus(currentStatus) {
//   switch (currentStatus) {
//     case "pending_restaurant_acceptance":
//       return "preparing";
//     case "preparing":
//       return "ready_for_pickup";
//     default:
//       return currentStatus;
//   }
// }

// function getStatusLabel(status) {
//   switch (status) {
//     case "pending_restaurant_acceptance":
//       return "Accept Order";
//     case "preparing":
//       return "Mark Ready for Pickup";
//     case "ready_for_pickup":
//       return "Awaiting Rider Pickup";
//     case "out_for_delivery":
//       return "Out for Delivery";
//     default:
//       return "Update Status";
//   }
// }

// // --- OrderCard Component ---

// function OrderCard({ order, onUpdateStatus, onRejectOrder }) {
//   const showActionButtons = ![
//     "delivered",
//     "restaurant_rejected",
//     "cancelled",
//   ].includes(order.status);

//   return (
//     <Card className="hover:shadow-lg transition-shadow duration-200 bg-gray-800 text-gray-100 border-gray-700">
//       <CardHeader>
//         <div className="flex justify-between items-start">
//           <div className="space-y-1">
//             <div className="flex items-center space-x-2">
//               <CardTitle className="text-lg text-gray-300">
//                 Order #{order.order_id}
//               </CardTitle>
//               <Badge className={getStatusColor(order.status)}>
//                 {order.status ? order.status.replace(/_/g, " ") : "N/A"}
//               </Badge>
//             </div>
//             <div className="flex items-center space-x-4 text-sm text-gray-400">
//               <div className="flex items-center">
//                 <Clock className="h-4 w-4 mr-1" />
//                 {new Date(order.created_at).toLocaleTimeString()}
//               </div>
//               {order.rider_name && (
//                 <div className="flex items-center">
//                   <User className="h-4 w-4 mr-1" />
//                   {order.rider_name} (Rider)
//                 </div>
//               )}
//             </div>
//           </div>
//           <div className="text-right">
//             <p className="text-xl font-bold text-purple-400">
//               Tk {parseFloat(order.total_amount).toFixed(2)}
//             </p>
//             <p className="text-sm text-gray-400">
//               {order.payment_method || "N/A"}
//             </p>
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <div className="flex items-center space-x-2">
//               <User className="h-4 w-4 text-gray-400" />
//               <span className="font-medium text-gray-200">
//                 {order.customer_name}
//               </span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <Phone className="h-4 w-4 text-gray-400" />
//               <span className="text-sm text-gray-300">
//                 {order.customer_phone}
//               </span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <MapPin className="h-4 w-4 text-gray-400" />
//               <span className="text-sm text-gray-300">
//                 {order.dropoff_addr}
//               </span>
//             </div>
//           </div>
//           <div className="space-y-2">
//             <h4 className="font-medium text-gray-300">Order Items:</h4>
//             {order.items &&
//               order.items.map((item, index) => (
//                 <div
//                   key={index}
//                   className="flex justify-between text-sm text-gray-200"
//                 >
//                   <span>
//                     {item.quantity}x {item.name}
//                   </span>
//                   <span>
//                     Tk {(parseFloat(item.price) * item.quantity).toFixed(2)}
//                   </span>
//                 </div>
//               ))}
//           </div>
//         </div>

//         {showActionButtons && (
//           <div className="flex space-x-2 pt-4 border-t border-gray-700">
//             <Button
//               onClick={() => {
//                 const nextStatus = getNextStatus(order.status);
//                 onUpdateStatus(order.order_id, nextStatus);
//               }}
//               className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
//               disabled={order.status === "ready_for_pickup"}
//             >
//               {getStatusLabel(order.status)}
//             </Button>
//             {order.status === "pending_restaurant_acceptance" && (
//               <Button
//                 variant="outline"
//                 onClick={() => onRejectOrder(order.order_id)}
//                 className="border-gray-600 text-gray-200 hover:bg-gray-700"
//               >
//                 Reject Order
//               </Button>
//             )}
//             {/* <Button
//               variant="outline"
//               className="border-gray-600 text-gray-200 hover:bg-gray-700"
//             >
//               <Phone className="h-4 w-4 mr-2" />
//               Call Customer
//             </Button> */}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// // --- OrderManagement Component ---

// function OrderManagement() {
//   const [orderList, setOrderList] = useState([]);
//   const { authRestaurant: restaurant } = restaurantAuthStore();

//   const fetchOrders = useCallback(async () => {
//     try {
//       const response = await axios.get("/api/restaurant/orders");
//       setOrderList(response.data);
//       console.log(response.data);
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//       setOrderList([]);
//     }
//   }, []);

//   const updateOrderStatus = useCallback(
//     async (orderId, newStatus) => {
//       setOrderList((prevOrders) =>
//         prevOrders.map((order) =>
//           order.order_id === orderId ? { ...order, status: newStatus } : order
//         )
//       );
//       try {
//         await axios.put(`/api/restaurant/orders/${orderId}/status`, {
//           status: newStatus,
//         });
//       } catch (error) {
//         console.error("Error updating order status:", error);
//         fetchOrders();
//         toast({
//           title: "Error",
//           description: "Failed to update order status. Please try again.",
//           variant: "destructive",
//         });
//       }
//     },
//     [restaurant, fetchOrders]
//   );

//   const rejectOrder = useCallback(
//     async (orderId) => {
//       setOrderList((prevOrders) =>
//         prevOrders.map((order) =>
//           order.order_id === orderId
//             ? { ...order, status: "restaurant_rejected" }
//             : order
//         )
//       );
//       try {
//         await axios.put(`/api/restaurant/orders/${orderId}/status`, {
//           status: "restaurant_rejected",
//         });
//       } catch (error) {
//         console.error("Error rejecting order:", error);
//         fetchOrders();
//         toast({
//           title: "Error",
//           description: "Failed to reject order. Please try again.",
//           variant: "destructive",
//         });
//       }
//     },
//     [fetchOrders]
//   );

//   // --- Socket Event Handlers ---
//   const handleNewOrder = useCallback(
//     (newOrder) => {
//       setOrderList((prevOrders) => [newOrder, ...prevOrders]);
//       const t = toast({
//         title: "New Order Received!",
//         description: `Order #${newOrder.order_id} from ${
//           newOrder.customer_name
//         } for Tk ${parseFloat(newOrder.total_amount).toFixed(2)}`,
//         action: {
//           label: "Accept",
//           onClick: () => {
//             updateOrderStatus(newOrder.order_id, "preparing");
//             t.dismiss();
//           },
//         },
//         cancel: {
//           label: "Reject",
//           onClick: () => {
//             rejectOrder(newOrder.order_id);
//             t.dismiss();
//           },
//         },
//         duration: 1000000,
//       });
//     },
//     [updateOrderStatus, rejectOrder]
//   );

//   const handleOrderStatusUpdated = useCallback((updatedOrder) => {
//     setOrderList((prevOrders) =>
//       prevOrders.map((order) =>
//         order.order_id === updatedOrder.order_id ? updatedOrder : order
//       )
//     );
//   }, []);

//   const handleOrderAccepted = useCallback(({ orderId, riderProfile }) => {
//     setOrderList((prevOrders) =>
//       prevOrders.map((order) =>
//         order.order_id === orderId
//           ? {
//               ...order,
//               rider_name: riderProfile.name,
//               rider_phone: riderProfile.phone_number,
//               status: "out_for_delivery",
//             }
//           : order
//       )
//     );
//   }, []);

//   useEffect(() => {
//     if (restaurant && restaurant.restaurant_id) {
//       socketService.joinRoom(`restaurant_${restaurant.restaurant_id}`);
//       // Join the correct room for this restaurant to receive notifications
//       if (socketService.socket) {
//         socketService.socket.emit(
//           "join_room",
//           `restaurant_${restaurant.restaurant_id}`
//         );
//       }
//       socketService.on("new_order", handleNewOrder);
//       socketService.on("order_status_updated", handleOrderStatusUpdated);
//       socketService.on("order_accepted", handleOrderAccepted);
//       fetchOrders();
//     }
//     return () => {
//       if (restaurant && restaurant.restaurant_id) {
//         socketService.off("new_order", handleNewOrder);
//         socketService.off("order_status_updated", handleOrderStatusUpdated);
//         socketService.off("order_accepted", handleOrderAccepted);
//       }
//     };
//   }, [
//     restaurant,
//     fetchOrders,
//     handleNewOrder,
//     handleOrderStatusUpdated,
//     handleOrderAccepted,
//   ]);

//   const filterOrdersByStatus = (status) => {
//     if (status === "all") return orderList;
//     console.log(orderList);
//     return orderList.filter((order) => order.status === status);
//   };

//   // 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
//   const statuses = [
//     "all",
//     "pending_restaurant_acceptance",
//     "preparing",
//     "ready_for_pickup",
//     "out_for_delivery",
//     "delivered",
//     "restaurant_rejected",
//   ];

//   return (
//     <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100">
//       {/* Page Header */}
//       <div>
//         <h1 className="text-2xl font-bold text-white">Order Management</h1>
//         <p className="text-gray-400">Track and manage incoming orders</p>
//       </div>

//       {/* Tabs for Order Filtering */}
//       <Tabs defaultValue="all" className="w-full">
//         <TabsList className="flex justify-around bg-gray-800 border border-gray-700">
//           {[
//             "all",
//             "pending_restaurant_acceptance",
//             "preparing",
//             "ready_for_pickup",
//             "out_for_delivery",
//             "delivered",
//             "restaurant_rejected",
//           ].map((tab) => (
//             <TabsTrigger
//               key={tab}
//               value={tab}
//               className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600"
//             >
//               {tab === "all"
//                 ? "All Orders"
//                 : tab.replace(/_/g, " ").charAt(0).toUpperCase() +
//                   tab.replace(/_/g, " ").slice(1)}
//             </TabsTrigger>
//           ))}
//         </TabsList>

//         {/* Tab Content for each Order Status */}
//         {[
//           "all",
//           "pending_restaurant_acceptance",
//           "preparing",
//           "ready_for_pickup",
//           "out_for_delivery",
//           "delivered",
//           "restaurant_rejected",
//         ].map((tab) => (
//           <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
//             {filterOrdersByStatus(tab).length > 0 ? (
//               filterOrdersByStatus(tab).map((order) => (
//                 <OrderCard
//                   key={order.order_id}
//                   order={order}
//                   onUpdateStatus={updateOrderStatus}
//                   onRejectOrder={rejectOrder}
//                 />
//               ))
//             ) : (
//               <div className="text-center py-8 text-gray-400">
//                 <p>No orders in this category.</p>
//               </div>
//             )}
//           </TabsContent>
//         ))}
//       </Tabs>
//     </div>
//   );
// }

// export default OrderManagement;
