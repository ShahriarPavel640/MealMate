import React, { useState, useMemo } from "react";
import { useCartStore } from "@/features/customer/store/cartStore";
import { Button } from "@/features/restaurant/components/ui/button";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/features/restaurant/components/ui/radio-group";
import { Label } from "@/features/restaurant/components/ui/label";
import { axiosInstance } from "@/lib/axios";
// import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { userAuthStore } from "@/features/customer/store/userAuthStore";
import toast from "react-hot-toast";

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCartStore();
  const { authUser } = userAuthStore();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const navigate = useNavigate();

  const deliveryFeePerRestaurant = 30;

  const ordersByRestaurant = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const { restaurant_id, restaurant_name } = item;
      if (!acc[restaurant_id]) {
        acc[restaurant_id] = {
          restaurant_name: restaurant_name || "Restaurant",
          items: [],
          subtotal: 0,
          deliveryFee: deliveryFeePerRestaurant,
        };
      }
      acc[restaurant_id].items.push(item);
      acc[restaurant_id].subtotal += item.price * item.quantity;
      return acc;
    }, {});
  }, [cartItems]);

  const totalItemsSubtotal = Object.values(ordersByRestaurant).reduce(
    (sum, order) => sum + order.subtotal,
    0
  );
  const totalDeliveryFee =
    Object.keys(ordersByRestaurant).length * deliveryFeePerRestaurant;
  const grandTotal = totalItemsSubtotal + totalDeliveryFee;

  const handlePlaceOrder = async () => {
    if (!authUser) {
      toast.error("Please log in to place an order.");
      return;
    }

    // Generate a unique transaction ID for this order
    const tran_id = `FOODPANDA_${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}`;

    // Prepare customer information
    const customerInfo = {
      name: authUser.name || "Guest User",
      email: authUser.email || "guest@example.com",
      address: authUser.address || "N/A", // Assuming address might be in authUser
      phone: authUser.phone_number || "N/A",
    };
    if (paymentMethod === "cod") {
      try {
        await axiosInstance.post("/customer/order/create", { cartItems });
        // toast({
        //   title: 'Orders placed successfully!',
        //   variant: 'success'
        // });
        toast.success("Orderes placed successfully!");

        clearCart();
        setTimeout(() => {
          navigate("/order-history");
        }, 500); // Delay navigation by 500ms to allow toast to show
      } catch (error) {
        // toast({
        //   title: 'Failed to place one or more orders.',
        //   variant: 'destructive'
        // });
        toast.error("Failed to place one or more orders.");
      }
    } else {
      try {
        const { data } = await axiosInstance.post(
          "/customer/payment/initiate",
          {
            cartItems,
            customerInfo,
            total_amount: grandTotal,
            tran_id,
            paymentMethod,
          }
        );
        if (data.status === "success" && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          toast.error("Failed to get payment URL.");
        }
      } catch (error) {
        // toast({
        //   title: 'Failed to initiate payment.',
        //   variant: 'destructive'
        // });
        toast.error("Failed to initiate payment");
      }
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 text-gray-800">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Orders</h2>
          {Object.keys(ordersByRestaurant).length > 0 ? (
            Object.entries(ordersByRestaurant).map(([restId, order]) => (
              <div key={restId} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-pink-600">
                  {order.restaurant_name}
                </h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.cart_item_id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        Tk {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <hr className="my-4" />
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Subtotal</span>
                  <span>Tk {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Delivery Fee</span>
                  <span>Tk {order.deliveryFee.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Total for {order.restaurant_name}</span>
                  <span>
                    Tk {(order.subtotal + order.deliveryFee).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p>Your cart is empty.</p>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">
              Payment Summary
            </h2>

            <div className="space-y-2 mb-6 text-gray-700">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>Tk {totalItemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Delivery Fee</span>
                <span>Tk {totalDeliveryFee.toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg text-gray-900">
                <span>Grand Total</span>
                <span>Tk {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              Payment Method
            </h3>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="space-y-3"
            >
              <Label className="flex items-center space-x-3 p-3 border rounded-lg text-gray-800 bg-white hover:bg-pink-50 cursor-pointer has-[:checked]:bg-pink-50 has-[:checked]:border-pink-500">
                <RadioGroupItem value="cod" id="cod" />
                <span>Cash on Delivery</span>
              </Label>
              <Label className="flex items-center space-x-3 p-3 border rounded-lg text-gray-800 bg-white hover:bg-pink-50 cursor-pointer has-[:checked]:bg-pink-50 has-[:checked]:border-pink-500">
                <RadioGroupItem value="sslcommerz" id="sslcommerz" />
                <span>Pay with SSLCommerz</span>
              </Label>
            </RadioGroup>

            <Button
              onClick={handlePlaceOrder}
              className="mt-6 w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold"
              disabled={cartItems.length === 0}
            >
              Confirm & Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
