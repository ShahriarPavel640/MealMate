import express from 'express';
import * as chatController from './chatController.js';
import authorization from '../../middleware/authorization.js';

const router = express.Router();

router.get('/', authorization, chatController.getConversations);
router.get('/:orderId', authorization, chatController.getMessages);
router.post('/:orderId', authorization, chatController.sendMessage);

export default router;
