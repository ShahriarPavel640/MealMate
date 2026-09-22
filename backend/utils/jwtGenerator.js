import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import redisClient from "./redisClient.js";
dotenv.config();

export const generateToken = async (id, role, res) => {
  // 1. Generate Access Token (15 minutes)
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // 2. Generate Refresh Token (7 days)
  const refreshToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // 3. Store Refresh Token in Redis (TTL: 7 days = 604800 seconds)
  await redisClient.set(`refresh_token:${id}`, refreshToken, {
    EX: 7 * 24 * 60 * 60,
  });

  // Determine cookie security:
  // - If COOKIE_SECURE is explicitly set ("true" / "false"), honor that setting.
  // - Otherwise, default to true only in production (HTTPS).
  // - In local environments (Docker Compose / Local K8s on HTTP), this ensures the browser accepts the cookie.
  const isSecure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

  // 4. Set Access Token Cookie
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
    httpOnly: true,          // Blocks client-side JS access to mitigate XSS attacks
    sameSite: "lax",         // Defends against CSRF while allowing seamless top-level navigation
    secure: isSecure,        // Only requires HTTPS if COOKIE_SECURE=true or in production
  });

  // 5. Set Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,                   // Blocks client-side JS access to mitigate XSS attacks
    sameSite: "lax",                  // Defends against CSRF while allowing seamless top-level navigation
    secure: isSecure,                 // Only requires HTTPS if COOKIE_SECURE=true or in production
  });

  return { accessToken, refreshToken };
};
