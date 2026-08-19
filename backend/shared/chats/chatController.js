import { getIO } from '../../socket.js';
import * as chatService from './chatService.js';
import logger from '../../utils/logger.js';

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info(`Backend: getConversations called for userId: ${userId}`);

    const conversations = await chatService.getConversations(userId);
    res.status(200).json(conversations);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const chat = await chatService.getChatByOrderId(orderId);
    if (!chat) {
      return res.status(200).json({ messages: [], otherParticipantName: '' }); 
    }
    const chatId = chat.chat_id;

    const participants = await chatService.getChatParticipants(chatId);

    let otherParticipantName = '';
    if (participants.length > 1) {
      const otherParticipant = participants.find(p => p.user_id !== userId);
      if (otherParticipant) {
        otherParticipantName = otherParticipant.users?.name;
      }
    }

    const messages = await chatService.getMessagesForOrder(orderId);

    await chatService.resetUnreadCount(chatId, userId);

    res.status(200).json({
      messages: messages,
      otherParticipantName: otherParticipantName,
    });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    let chat;
    try {
      chat = await chatService.getOrCreateChat(orderId);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      throw err;
    }
    
    const chatId = chat.chat_id;

    const newMessage = await chatService.saveMessage(chatId, userId, message);
    const messageWithSenderName = { ...newMessage, chat_order_id: orderId };

    await chatService.incrementOtherUnreadCounts(chatId, userId);

    const io = getIO();
    const rooms = [orderId.toString()];

    const participants = await chatService.getChatParticipants(chatId);
    participants.forEach(participant => {
      rooms.push(`${participant.role}_${participant.user_id}`);
    });

    logger.info(`Attempting to emit 'receive_message' to rooms: ${rooms.join(", ")}`);
    io.to(rooms).emit('receive_message', messageWithSenderName);

    res.status(200).json(messageWithSenderName);
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await chatService.getTotalUnreadCount(userId);
    res.status(200).json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const chat = await chatService.getChatByOrderId(orderId);
    if (!chat) {
      return res.status(404).json({ message: 'No chat found for this order' });
    }
    
    await chatService.resetUnreadCount(chat.chat_id, userId);

    res.status(200).json({ message: 'Chat marked as read' });
  } catch (err) {
    next(err);
  }
};
