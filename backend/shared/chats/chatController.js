import pool from '../../db.js';
import { getIO } from '../../socket.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Backend: getConversations called for userId: ${userId}`);
    console.log(`Backend: req.user object:`, req.user);

    const conversations = await pool.query(
      `
      SELECT
          c.chat_id,
          c.order_id,
          other_p.user_id AS participant_user_id,
          u.name AS participant_name,
          other_p.role AS participant_role
      FROM
          chat_participants AS self_p
      JOIN
          chats AS c ON self_p.chat_id = c.chat_id
      JOIN
          chat_participants AS other_p ON c.chat_id = other_p.chat_id AND self_p.user_id != other_p.user_id
      JOIN
          users AS u ON other_p.user_id = u.user_id
      WHERE
          self_p.user_id = $1;
      `,
      [userId]
    );
    console.log(`Backend: getConversations query result for userId ${userId}:`, conversations.rows);

    res.json(conversations.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Get chat_id for the order
    const chatResult = await pool.query('SELECT chat_id FROM chats WHERE order_id = $1', [orderId]);
    if (chatResult.rows.length === 0) {
      return res.json({ messages: [], otherParticipantName: '' }); // No chat for this order yet
    }
    const chatId = chatResult.rows[0].chat_id;

    // Get participants for the chat
    const participantsResult = await pool.query(
      `SELECT cp.user_id, u.name
       FROM chat_participants cp
       JOIN users u ON cp.user_id = u.user_id
       WHERE cp.chat_id = $1`,
      [chatId]
    );

    let otherParticipantName = '';
    if (participantsResult.rows.length > 1) {
      const otherParticipant = participantsResult.rows.find(p => p.user_id !== userId);
      if (otherParticipant) {
        otherParticipantName = otherParticipant.name;
      }
    }

    const messages = await pool.query(
      `
      SELECT cm.message_id, cm.sender_id, cm.message, cm.sent_at, u.name AS sender_name, u.role_id AS sender_role
      FROM chat_messages cm
      JOIN chats c ON cm.chat_id = c.chat_id
      JOIN users u ON cm.sender_id = u.user_id
      WHERE c.order_id = $1
      ORDER BY cm.sent_at ASC
      `,
      [orderId]
    );

    // Mark chat as read since it was just opened
    await pool.query(
      'UPDATE chat_participants SET unread_count = 0 WHERE chat_id = $1 AND user_id = $2',
      [chatId, userId]
    );

    // Combine messages with other participant's name
    res.json({
      messages: messages.rows,
      otherParticipantName: otherParticipantName,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    let chatId;

    // Try to find existing chat
    let chat = await pool.query('SELECT chat_id FROM chats WHERE order_id = $1', [orderId]);

    if (chat.rows.length === 0) {
      // If no chat found, try to create one
      try {
        const newChat = await pool.query('INSERT INTO chats (order_id) VALUES ($1) RETURNING chat_id', [orderId]);
        chatId = newChat.rows[0].chat_id;

        console.log(`Backend: Attempting to fetch order for orderId: ${orderId}`);
        const order = await pool.query('SELECT user_id, rider_id FROM orders WHERE order_id = $1', [orderId]);
        console.log(`Backend: Order fetch result for orderId ${orderId}:`, order.rows[0]);

        if (order.rows.length === 0) {
          throw new Error(`Order with ID ${orderId} not found.`);
        }

        const { user_id, rider_id } = order.rows[0];
        if (!rider_id) {
          return res.status(400).json({ message: "Cannot start a chat before a rider has accepted the order." });
        }
        console.log(`Backend: Extracted user_id: ${user_id}, rider_id: ${rider_id}`);

        await pool.query('INSERT INTO chat_participants (chat_id, user_id, role) VALUES ($1, $2, $3), ($1, $4, $5)', [chatId, user_id, 'customer', rider_id, 'rider']);
      } catch (insertError) {
        // If insert fails due to duplicate key, it means another process created it
        if (insertError.code === '23505') { // PostgreSQL unique violation error code
          console.warn(`Race condition: Chat for order ${orderId} already created. Retrieving existing chat_id.`);
          chat = await pool.query('SELECT chat_id FROM chats WHERE order_id = $1', [orderId]);
          if (chat.rows.length > 0) {
            chatId = chat.rows[0].chat_id;
          } else {
            // This case should ideally not happen if 23505 was thrown
            throw new Error('Failed to retrieve chat_id after duplicate key error.');
          }
        } else {
          throw insertError; // Re-throw other errors
        }
      }
    } else {
      chatId = chat.rows[0].chat_id;
    }

    const newMessage = await pool.query(
      'INSERT INTO chat_messages (chat_id, sender_id, message) VALUES ($1, $2, $3) RETURNING *'
      ,
      [chatId, userId, message]
    );

    const senderInfo = await pool.query('SELECT name, role_id FROM users WHERE user_id = $1', [userId]);
    const messageWithSenderName = { ...newMessage.rows[0], sender_name: senderInfo.rows[0].name, sender_role: senderInfo.rows[0].role_id };

    // Increment unread_count for the other participant(s)
    await pool.query(
      'UPDATE chat_participants SET unread_count = unread_count + 1 WHERE chat_id = $1 AND user_id != $2',
      [chatId, userId]
    );

    const io = getIO();
    const rooms = [orderId.toString()];

    // Also emit to individual participant rooms
    const participants = await pool.query(
      `SELECT user_id, role FROM chat_participants WHERE chat_id = $1`,
      [chatId]
    );

    participants.rows.forEach(participant => {
      rooms.push(`${participant.role}_${participant.user_id}`);
    });

    console.log(`Attempting to emit 'receive_message' to rooms:`, rooms);
    io.to(rooms).emit('receive_message', messageWithSenderName);

    res.json(messageWithSenderName);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT SUM(unread_count) AS total_unread FROM chat_participants WHERE user_id = $1',
      [userId]
    );
    const count = parseInt(result.rows[0].total_unread) || 0;
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Error fetching unread count:', err.message);
    res.status(500).send('Server error');
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    await pool.query(
      'UPDATE chat_participants SET unread_count = 0 WHERE chat_id = $1 AND user_id = $2',
      [chatId, userId]
    );

    res.json({ message: 'Chat marked as read' });
  } catch (err) {
    console.error('Error marking chat as read:', err.message);
    res.status(500).send('Server error');
  }
};
