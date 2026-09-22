export interface SSLCommerzIPNPayload {
  tran_id: string;
  val_id: string;
  amount: string;
  card_type: string;
  store_amount: string;
  card_no: string;
  bank_tran_id: string;
  status: string;
  tran_date: string;
  error: string;
  currency: string;
  card_issuer: string;
  card_brand: string;
  card_sub_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  store_id: string;
  verify_sign: string;
  verify_key: string;
  verify_sign_sha2: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  base_fair: string;
  value_a: string;
  value_b: string;
  value_c: string;
  value_d: string;
  subscription_id: string;
  risk_level: string;
  risk_title: string;
}

import { Prisma } from '@prisma/client';
import SSLCommerzPayment from 'sslcommerz-lts';
import prisma from '@/prismaClient.js';
import { createOrderFromCart, fetchFullOrderDetails } from '@/customer/order/orderService.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@/middleware/errorHandler.js';
import logger from '@/utils/logger.js';
import { z } from 'zod';
import { initiatePaymentSchema } from './paymentSchemas.js';
import env from '@/config/env.js';

type InitiatePaymentPayload = z.infer<typeof initiatePaymentSchema> & {
  userId: number;
  store_id: string;
  store_passwd: string;
};

const is_live = env.SSL_COMMERZ_IS_LIVE;

export const initiatePaymentService = async ({
  userId,
  cartItems,
  customerInfo,
  total_amount,
  paymentMethod = 'sslcommerz',
  specialInstructions = {},
  store_id,
  store_passwd,
}: InitiatePaymentPayload) => {
  const tran_id = `TXN_${Date.now()}_${userId}_${uuidv4()}`;

  // Atomic order and payment record creation in Prisma transaction
  const { createdOrders, totalCalculatedAmount } = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const orders = await createOrderFromCart(
        userId,
        cartItems as any,
        tx,
        tran_id,
        'pending_payment',
        specialInstructions
      );

      let calcTotal = 0;
      for (const order of orders) {
        calcTotal += Number(order.total_amount);
        await tx.payments.create({
          data: {
            order_id: order.order_id,
            user_id: userId,
            method_type: paymentMethod as any,
            amount: order.total_amount,
            status: 'pending',
            tran_id: tran_id,
          },
        });
      }

      return { createdOrders: orders, totalCalculatedAmount: calcTotal };
    }
  );

  const frontendUrl = env.FRONTEND_URL;
  const backendUrl = env.BACKEND_URL;

  const addressString =
    typeof customerInfo.address === 'object'
      ? `${customerInfo.address?.street || ''}, ${customerInfo.address?.city || ''}, ${customerInfo.address?.postal_code || ''}`
      : customerInfo.address || 'N/A';

  const data = {
    total_amount: total_amount || totalCalculatedAmount,
    currency: 'BDT',
    tran_id: tran_id,
    success_url: `${backendUrl}/api/customer/payment/success?tran_id=${tran_id}`,
    fail_url: `${backendUrl}/api/customer/payment/fail?tran_id=${tran_id}`,
    cancel_url: `${backendUrl}/api/customer/payment/cancel?tran_id=${tran_id}`,
    ipn_url: `${backendUrl}/api/customer/payment/ipn`,
    shipping_method: 'Courier',
    product_name: 'Food Order',
    product_category: 'Food',
    product_profile: 'general',
    cus_name: customerInfo.name,
    cus_email: customerInfo.email,
    cus_add1: addressString,
    cus_add2: 'N/A',
    cus_city: 'N/A',
    cus_state: 'N/A',
    cus_postcode: 'N/A',
    cus_country: 'Bangladesh',
    cus_phone: customerInfo.phone,
    cus_fax: 'N/A',
    ship_name: customerInfo.name,
    ship_add1: addressString,
    ship_add2: 'N/A',
    ship_city: 'N/A',
    ship_state: 'N/A',
    ship_postcode: 'N/A',
    ship_country: 'Bangladesh',
  };

  const sslcz = new SSLCommerzPayment(
    store_id || env.STORE_ID,
    store_passwd || env.STORE_PASSWD,
    is_live
  );
  const apiResponse = (await sslcz.init(data)) as { status?: string; GatewayPageURL?: string };

  if (apiResponse.status === 'SUCCESS') {
    return {
      paymentUrl: apiResponse.GatewayPageURL,
      status: 'success',
      tran_id,
    };
  } else {
    // Rollback by cancelling created orders
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payments.updateMany({
        where: { tran_id },
        data: { status: 'failed' },
      });
      await tx.orders.updateMany({
        where: { tran_id },
        data: { status: 'cancelled' },
      });
    });
    logger.error('SSLCommerz initiation failed:', apiResponse);
    throw new AppError('Payment initiation failed', 400);
  }
};

export const handleSuccessService = async (tran_id: string | any) => {
  if (!tran_id) {
    throw new AppError('Transaction ID is missing', 400);
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.payments.updateMany({
      where: { tran_id },
      data: { status: 'completed' },
    });

    await tx.orders.updateMany({
      where: { tran_id },
      data: { status: 'pending_restaurant_acceptance' },
    });

    const orders = await tx.orders.findMany({
      where: { tran_id },
    });

    if (orders.length > 0) {
      // Clear user active cart
      await tx.carts.updateMany({
        where: { user_id: orders[0].user_id!, status: 'active' },
        data: { status: 'completed' },
      });

      for (const order of orders) {
        await tx.notifications.create({
          data: {
            user_id: order.user_id!,
            target_type: 'restaurant',
            target_id: order.restaurant_id!,
            order_id: order.order_id,
            type: 'order_update',
            message: `You have a new order (#${order.order_id}) from a customer (Paid via SSLCommerz).`,
          },
        });
      }
    }

    // Fetch full order details for socket emissions
    const fullOrders = [];
    for (const order of orders) {
      const fullOrder = await fetchFullOrderDetails(order.order_id, tx);
      if (fullOrder) {
        fullOrders.push(fullOrder);
      }
    }

    return { tran_id, orders, fullOrders };
  });
};

export const handleFailService = async (tran_id: string | any) => {
  if (tran_id) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payments.updateMany({
        where: { tran_id },
        data: { status: 'failed' },
      });
      await tx.orders.updateMany({
        where: { tran_id },
        data: { status: 'cancelled' },
      });
    });
  }
  return { tran_id };
};

export const handleCancelService = async (tran_id: string | any) => {
  if (tran_id) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payments.updateMany({
        where: { tran_id },
        data: { status: 'cancelled' },
      });
      await tx.orders.updateMany({
        where: { tran_id },
        data: { status: 'cancelled' },
      });
    });
  }
  return { tran_id };
};

export const handleIPNService = async (body: SSLCommerzIPNPayload, store_id: string, store_passwd: string) => {
  logger.info('Received SSLCommerz IPN', { body });
  return { message: 'IPN received (placeholder)' };
};
