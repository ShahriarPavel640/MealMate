import prisma from "../../prismaClient.js";

export const getNotifications = async (targetId, targetType, limit, offset) => {
  return await prisma.notifications.findMany({
    where: {
      target_id: targetId,
      target_type: targetType
    },
    orderBy: {
      created_at: 'desc'
    },
    take: limit,
    skip: offset
  });
};

export const markAsRead = async (targetId, targetType) => {
  await prisma.notifications.updateMany({
    where: {
      target_id: targetId,
      target_type: targetType,
      is_read: false
    },
    data: {
      is_read: true
    }
  });
};
