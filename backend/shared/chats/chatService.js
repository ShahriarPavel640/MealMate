import prisma from "../../prismaClient.js";

export const getConversations = async (userId) => {
  const participations = await prisma.chat_participants.findMany({
    where: { user_id: userId },
    include: {
      chats: {
        include: {
          chat_participants: {
            where: { user_id: { not: userId } },
            include: { users: { select: { name: true } } }
          }
        }
      }
    }
  });

  return participations.map(p => {
    const otherParticipant = p.chats?.chat_participants[0];
    return {
      chat_id: p.chat_id,
      order_id: p.chats?.order_id,
      participant_user_id: otherParticipant?.user_id,
      participant_name: otherParticipant?.users?.name,
      participant_role: otherParticipant?.role,
      unread_count: p.unread_count
    };
  });
};

export const getChatByOrderId = async (orderId) => {
  return await prisma.chats.findFirst({
    where: { order_id: parseInt(orderId, 10) }
  });
};

export const getChatParticipants = async (chatId) => {
  return await prisma.chat_participants.findMany({
    where: { chat_id: chatId },
    include: { users: { select: { name: true } } }
  });
};

export const getMessagesForOrder = async (orderId) => {
  const messages = await prisma.chat_messages.findMany({
    where: { chats: { order_id: parseInt(orderId, 10) } },
    orderBy: { sent_at: 'asc' },
    include: { users: { select: { name: true, role_id: true } } }
  });

  return messages.map(m => ({
    message_id: m.message_id,
    sender_id: m.sender_id,
    message: m.message,
    sent_at: m.sent_at,
    sender_name: m.users?.name,
    sender_role: m.users?.role_id
  }));
};

export const resetUnreadCount = async (chatId, userId) => {
  await prisma.chat_participants.updateMany({
    where: { chat_id: chatId, user_id: userId },
    data: { unread_count: 0 }
  });
};

export const createChat = async (orderId, customerId, riderId) => {
  // Using a transaction to ensure everything is created together
  return await prisma.$transaction(async (tx) => {
    const newChat = await tx.chats.create({
      data: { order_id: parseInt(orderId, 10) }
    });

    await tx.chat_participants.createMany({
      data: [
        { chat_id: newChat.chat_id, user_id: customerId, role: 'customer' },
        { chat_id: newChat.chat_id, user_id: riderId, role: 'rider' }
      ]
    });

    return newChat;
  });
};

export const getOrderDetails = async (orderId) => {
  return await prisma.orders.findUnique({
    where: { order_id: parseInt(orderId, 10) },
    select: { user_id: true, rider_id: true }
  });
};

export const getOrCreateChat = async (orderId) => {
  let chat = await getChatByOrderId(orderId);

  if (!chat) {
    try {
      const order = await getOrderDetails(orderId);
      if (!order) {
        throw { status: 404, message: `Order with ID ${orderId} not found.` };
      }

      const { user_id, rider_id } = order;
      if (!rider_id) {
        throw { status: 400, message: "Cannot start a chat before a rider has accepted the order." };
      }

      chat = await createChat(orderId, user_id, rider_id);
    } catch (insertError) {
      if (insertError.code === 'P2002') {
        chat = await getChatByOrderId(orderId);
        if (!chat) {
          throw new Error('Failed to retrieve chat_id after duplicate key error.');
        }
      } else {
        throw insertError;
      }
    }
  }

  return chat;
};

export const saveMessage = async (chatId, userId, message) => {
  const newMessage = await prisma.chat_messages.create({
    data: {
      chat_id: chatId,
      sender_id: userId,
      message: message
    },
    include: { users: { select: { name: true, role_id: true } } }
  });

  return {
    ...newMessage,
    sender_name: newMessage.users?.name,
    sender_role: newMessage.users?.role_id
  };
};

export const incrementOtherUnreadCounts = async (chatId, senderId) => {
  await prisma.chat_participants.updateMany({
    where: { chat_id: chatId, user_id: { not: senderId } },
    data: { unread_count: { increment: 1 } }
  });
};

export const getTotalUnreadCount = async (userId) => {
  const result = await prisma.chat_participants.aggregate({
    _sum: { unread_count: true },
    where: { user_id: userId }
  });
  return result._sum.unread_count || 0;
};
