import express from 'express';
import * as chatController from './chatController.js';
import authorization from '@/middleware/authorization.js';
import { validate } from '@/middleware/validate.js';
import { sendMessageSchema } from './chatSchemas.js';

const router = express.Router();

router.get('/', authorization, chatController.getConversations);
router.get('/unread-count', authorization, chatController.getUnreadCount);
router.get('/:orderId', authorization, chatController.getMessages);
router.post('/:orderId', authorization, validate(sendMessageSchema), chatController.sendMessage);
router.put('/:orderId/read', authorization, chatController.markAsRead);

export default router;
