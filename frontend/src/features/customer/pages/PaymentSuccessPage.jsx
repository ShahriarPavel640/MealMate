import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useCartStore } from "@/features/customer/store/cartStore";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tran_id = queryParams.get('tran_id');
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear cart upon successful payment redirect
    clearCart();
    
    // You might want to make an API call to your backend here
    // to confirm the payment status for this tran_id,
    // especially if you didn't rely solely on IPN.
    console.log('Payment Success for Transaction ID:', tran_id);
  }, [tran_id, clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-lg text-gray-700 mb-6">Your order has been placed successfully.</p>
        {tran_id && (
          <p className="text-sm text-gray-500 mb-6">Transaction ID: {tran_id}</p>
        )}
        <Link to="/order-history" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          View Order History
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;