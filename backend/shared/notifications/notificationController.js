import * as notificationService from "./notificationService.js";

export const getNotifications = async (req, res, next) => {
  try {
    const targetId = req.user.id || req.user.restaurant_id; 
    
    let targetType = 'user';
    if (req.user.role === 'restaurant') targetType = 'restaurant';
    if (req.user.role === 'rider') targetType = 'rider';

    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    const notifications = await notificationService.getNotifications(targetId, targetType, limit, offset);

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const targetId = req.user.id || req.user.restaurant_id;

    let targetType = 'user';
    if (req.user.role === 'restaurant') targetType = 'restaurant';
    if (req.user.role === 'rider') targetType = 'rider';

    await notificationService.markAsRead(targetId, targetType);

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
