import "./instrument.js";
import * as Sentry from "@sentry/node";
import express from "express";
import dotenv from "dotenv";
import SSLCommerzPayment from "sslcommerz-lts";
import cors from "cors";
import http from "http"; // Import http module
import { initSocket, getIO } from "./socket.js"; // Import initSocket and getIO
import customerAuthRoute from "./customer/auth/authRoutes.js";
import customerRestaurantRoutes from "./customer/restaurant/restaurantRoutes.js";
import customerCartRoutes from "./customer/cart/cartRoutes.js";
import router from "./rider/profile/riderRoutes.js";
import { router as restaurantRoute } from "./restaurants/profile/restaurantProfileRoutes.js";
import menuRoutes from "./restaurants/menu/menuRoutes.js"; // Import the menu routes
import cookieParser from "cookie-parser";
import riderAuthRoute from "./rider/auth/riderAuthRoutes.js";
import customerOrderRoutes from "./customer/order/orderRoutes.js";
import createCustomerPaymentRoutes from "./customer/payment/paymentRoutes.js";
import reviewRoutes from "./shared/reviews/reviewRoutes.js";
import chatRoutes from "./shared/chats/chatRoutes.js";
import restaurantOrder from "./restaurants/order/orderRoutes.js";
import restaurnatStat from "./restaurants/stats/statsRoutes.js";
import notificationRoutes from "./shared/notifications/notificationRoutes.js";
import { connectRedis } from "./utils/redisClient.js";
import aiRoutes from "./shared/ai/aiRoutes.js";

dotenv.config();const app = express();
const server = http.createServer(app); // Create an HTTP server

// Initialize Socket.IO
const io = initSocket(server);

// Connect to Redis
await connectRedis();

app.use(express.json());

// Middleware to log API execution time and status codes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.error(`[ERROR] [${req.method}] ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`);
    } else {
      console.log(`[${req.method}] ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5175",
  "http://192.168.0.101:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Register routes

//console.log("Registering rider routes...");
app.use("/api/rider", riderAuthRoute);
app.use("/api/rider/data", router);

//console.log("Registering restaurant routes...");
app.use("/api/restaurant", restaurantRoute);
app.use("/api/restaurant", restaurantOrder); //restaurant order management
app.use("/api/restaurant/stats", restaurnatStat); // for fetching restaurnant statistics
console.log("Registering menu routes...");
app.use("/api/menu", menuRoutes); // Register the menu routes

//console.log("Registering customer payment routes...");

const store_id = process.env.SSL_COMMERZ_STORE_ID;
const store_passwd = process.env.SSL_COMMERZ_STORE_PASSWORD;
//console.log("Loaded SSLCommerz Store ID:", store_id);
//console.log("Loaded SSLCommerz Store Password:", store_passwd);

if (!store_id || !store_passwd) {
  console.error(
    "ERROR: SSLCommerz store_id or store_passwd is missing. Check your .env file."
  );
  process.exit(1);
}

const customerPaymentRoutes = createCustomerPaymentRoutes(
  store_id,
  store_passwd
);

app.use("/api/customer/payment", customerPaymentRoutes);
//console.log("Registering review routes...");
app.use("/api/customer/review", reviewRoutes);
//console.log("Registering customer authentication routes...");
app.use("/api/customer", customerAuthRoute);
//console.log("Registering customer restaurant routes...");
app.use("/api/customer", customerRestaurantRoutes);
//console.log("Registering customer cart routes...");
app.use("/api/customer", customerCartRoutes);
//console.log("Registering customer order routes...");
app.use("/api/customer/order", customerOrderRoutes);

app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);

// Sentry error handler must be registered after all controllers and before any other error middleware
Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 5001;
let serverInstance;
if (process.env.NODE_ENV !== "test") {
  serverInstance = server.listen(PORT, () => {
    console.log(`Backend HTTP server is running on port: ${PORT}`);
  });
}

// Graceful shutdown logic for nodemon (SIGUSR2) and manual kill (SIGINT/SIGTERM)
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (serverInstance) {
    serverInstance.close(() => console.log('HTTP server closed.'));
  }
  const redisClient = (await import("./utils/redisClient.js")).default;
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis connection closed.');
  }
  process.exit(0);
};

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { app, server, io }; // Export the app, server, and io instance
