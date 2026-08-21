/* eslint-disable */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/features/restaurant/components/ui/button";

const SimulatePaymentGateway = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const paymentId = queryParams.get('paymentId');

  const handleConfirm = () => {
    window.location.href = `/api/customer/payment/confirm?paymentId=${paymentId}&status=success`;
  };

  const handleCancel = () => {
    window.location.href = `/api/customer/payment/confirm?paymentId=${paymentId}&status=cancel`;
  };

  return (
    <div className="container mx-auto p-4 text-center text-gray-800 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Simulated Payment Gateway</h1>
      <p className="mb-4 text-gray-700">You are about to make a payment.</p>
      <div className="space-x-4">
        <Button onClick={handleConfirm}>Confirm Payment</Button>
        <Button onClick={handleCancel} variant="destructive">Cancel Payment</Button>
      </div>
    </div>
  );
};

export default SimulatePaymentGateway;
