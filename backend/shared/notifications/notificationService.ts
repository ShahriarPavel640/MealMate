import prisma from '@/prismaClient.js';

export const getNotifications = async (targetId: number, targetType: 'user' | 'restaurant' | 'rider', limit: number, offset: number) => {
  return await prisma.notifications.findMany({
    where: {
      target_id: targetId,
      target_type: targetType,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
    skip: offset,
  });
};

export const markAsRead = async (targetId: number, targetType: 'user' | 'restaurant' | 'rider') => {
  await prisma.notifications.updateMany({
    where: {
      target_id: targetId,
      target_type: targetType,
      is_read: false,
    },
    data: {
      is_read: true,
    },
  });
};
