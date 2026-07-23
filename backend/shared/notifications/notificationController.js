import pool from "../../db.js";

export const getNotifications = async (req, res) => {
  try {
    const targetId = req.user.id || req.user.restaurant_id; 
    
    let targetType = 'user';
    if (req.user.role === 'restaurant') targetType = 'restaurant';
    if (req.user.role === 'rider') targetType = 'rider';

    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    const query = `
      SELECT n.*
      FROM notifications n
      WHERE n.target_id = $1 AND n.target_type = $2
      ORDER BY n.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [targetId, targetType, limit, offset]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const targetId = req.user.id || req.user.restaurant_id;

    let targetType = 'user';
    if (req.user.role === 'restaurant') targetType = 'restaurant';
    if (req.user.role === 'rider') targetType = 'rider';

    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE target_id = $1 AND target_type = $2 AND is_read = false
    `;

    await pool.query(query, [targetId, targetType]);

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Server error marking notifications as read" });
  }
};
