import prisma from '@/prismaClient.js';
import { AppError } from '@/middleware/errorHandler.js';
import { z } from 'zod';
import { addToCartSchema } from './cartSchemas.js';

const getOrCreateActiveCart = async (userId: number) => {
  let cart = await prisma.carts.findFirst({
    where: {
      user_id: userId,
      status: 'active',
    },
  });

  if (!cart) {
    cart = await prisma.carts.create({
      data: {
        user_id: userId,
        status: 'active',
      },
    });
  }

  return cart;
};

export const getCart = async (userId: number) => {
  // Raw query to preserve flattened field structure expected by the frontend
  const result = await prisma.$queryRaw`
    SELECT ci.quantity, c.cart_id, ci.cart_item_id, mi.menu_item_id, mi.name, mi.price, mi.menu_item_image_url as image
    FROM carts c
    JOIN cart_item ci ON c.cart_id = ci.cart_id
    JOIN menu_items mi ON ci.menu_item_id = mi.menu_item_id
    WHERE c.user_id = ${userId} AND c.status = 'active'
  `;

  return { cart: result };
};

export const addToCart = async (userId: number, data: z.infer<typeof addToCartSchema>) => {
  const { menu_item_id, restaurant_id, quantity } = data;

  const cart = await getOrCreateActiveCart(userId);

  const existingItem = await prisma.cart_item.findFirst({
    where: {
      cart_id: cart.cart_id,
      menu_item_id: menu_item_id,
    },
  });

  if (!existingItem) {
    const newItem = await prisma.cart_item.create({
      data: {
        cart_id: cart.cart_id,
        menu_item_id: menu_item_id,
        restaurant_id: restaurant_id,
        quantity: quantity,
      },
    });
    return { message: 'Item added to cart', item: newItem };
  } else {
    const updatedItem = await prisma.cart_item.update({
      where: {
        cart_item_id: existingItem.cart_item_id,
      },
      data: {
        quantity: (existingItem.quantity || 0) + quantity,
      },
    });
    return { message: 'Item quantity updated', item: updatedItem };
  }
};

export const deleteCartItem = async (userId: number, cartItemId: number) => {
  const item = await prisma.cart_item.findFirst({
    where: {
      cart_item_id: cartItemId,
      carts: { user_id: userId },
    },
  });

  if (!item) throw new AppError('Cart item not found', 404);

  await prisma.cart_item.delete({ where: { cart_item_id: item.cart_item_id } });
  return { message: 'Item deleted from cart.' };
};
