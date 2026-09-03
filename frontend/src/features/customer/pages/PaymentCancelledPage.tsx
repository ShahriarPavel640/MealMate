import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

const PaymentCancelledPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tran_id = queryParams.get('tran_id');

  useEffect(() => {
    console.log('Payment Cancelled for Transaction ID:', tran_id);
  }, [tran_id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-yellow-600 mb-4">Payment Cancelled</h1>
        <p className="text-lg text-gray-700 mb-6">You have cancelled the payment process.</p>
        {tran_id && (
          <p className="text-sm text-gray-500 mb-6">Transaction ID: {tran_id}</p>
        )}
        <Link to="/checkout" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mr-4">
          Go to Checkout
        </Link>
        <Link to="/" className="text-yellow-500 hover:underline">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default PaymentCancelledPage;
