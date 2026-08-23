import jwt from "jsonwebtoken";
import redisClient from "../../utils/redisClient.js";
import { generateToken } from "../../utils/jwtGenerator.js";
import dotenv from "dotenv";
dotenv.config();

export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided." });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const userId = decoded.id;
    const role = decoded.role;

    // Check if token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token is invalid or expired." });
    }

    // Issue new tokens (generateToken will overwrite the old ones in Redis and cookies)
    await generateToken(userId, role, res);

    return res.status(200).json({ message: "Tokens refreshed successfully" });
  } catch (err) {
    console.error("Refresh token error:", err.message);
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};
