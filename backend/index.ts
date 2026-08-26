import './instrument.js';
import * as Sentry from '@sentry/node';
import express from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import SSLCommerzPayment from 'sslcommerz-lts';
import cors from 'cors';
import http from 'http'; // Import http module
import { initSocket, getIO } from './socket.js'; // Import initSocket and getIO
import customerAuthRoute from './customer/auth/authRoutes.js';
import customerRestaurantRoutes from './customer/restaurant/restaurantRoutes.js';
import customerCartRoutes from './customer/cart/cartRoutes.js';
import profileRoutes from './rider/profile/profileRoutes.js';
import orderRoutes from './rider/order/orderRoutes.js';
import statsRoutes from './rider/stats/statsRoutes.js';
import { router as restaurantRoute } from './restaurant/profile/restaurantProfileRoutes.js';
import menuRoutes from './restaurant/menu/menuRoutes.js'; // Import the menu routes
import cookieParser from 'cookie-parser';
import riderAuthRoute from './rider/auth/riderAuthRoutes.js';
import customerOrderRoutes from './customer/order/orderRoutes.js';
import createCustomerPaymentRoutes from './customer/payment/paymentRoutes.js';
import reviewRoutes from './shared/reviews/reviewRoutes.js';
import chatRoutes from './shared/chats/chatRoutes.js';
import restaurantOrder from './restaurant/order/orderRoutes.js';
import restaurantStat from './restaurant/stats/statsRoutes.js';
import notificationRoutes from './shared/notifications/notificationRoutes.js';
import sharedAuthRoutes from './shared/auth/authRoutes.js';
import { connectRedis } from './utils/redisClient.js';
import aiRoutes from './shared/ai/aiRoutes.js';
import { metricsMiddleware, register } from './utils/metrics.js';
import { errorHandler } from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.js';

dotenv.config();
const app = express();
const server = http.createServer(app); // Create an HTTP server

// Initialize Socket.IO
const io = initSocket(server);

// Connect to Redis
await connectRedis();

app.use(express.json());
app.use(metricsMiddleware);

// Middleware to log API execution time and status codes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
    };
    if (res.statusCode >= 400) {
      logger.error('API Request Failed', logData);
    } else {
      logger.info('API Request Successful', logData);
    }
  });
  next();
});
app.use(cookieParser());

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: { withCredentials: true },
  })
);

// Register routes

//logger.info("Registering rider routes...");
app.use('/api/rider', riderAuthRoute);
app.use('/api/rider/profile', profileRoutes);
app.use('/api/rider/orders', orderRoutes);
app.use('/api/rider/stats', statsRoutes);

//logger.info("Registering restaurant routes...");
app.use('/api/restaurant', restaurantRoute);
app.use('/api/restaurant', restaurantOrder); //restaurant order management
app.use('/api/restaurant/stats', restaurantStat); // for fetching restaurnant statistics
logger.info('Registering menu routes...');
app.use('/api/menu', menuRoutes); // Register the menu routes

//logger.info("Registering customer payment routes...");

const store_id = process.env.SSL_COMMERZ_STORE_ID;
const store_passwd = process.env.SSL_COMMERZ_STORE_PASSWORD;

if (!store_id || !store_passwd) {
  logger.error('ERROR: SSLCommerz store_id or store_passwd is missing. Check your .env file.');
  process.exit(1);
}

const customerPaymentRoutes = createCustomerPaymentRoutes(store_id, store_passwd);

app.use('/api/customer/payment', customerPaymentRoutes);
//logger.info("Registering review routes...");
app.use('/api/customer/review', reviewRoutes);
//logger.info("Registering customer authentication routes...");
app.use('/api/customer', customerAuthRoute);
//logger.info("Registering customer restaurant routes...");
app.use('/api/customer', customerRestaurantRoutes);
//logger.info("Registering customer cart routes...");
app.use('/api/customer', customerCartRoutes);
//logger.info("Registering customer order routes...");
app.use('/api/customer/order', customerOrderRoutes);

app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', sharedAuthRoutes);

// Expose metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Sentry error handler must be registered after all controllers and before any other error middleware
Sentry.setupExpressErrorHandler(app);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let serverInstance: import('http').Server | undefined;
if (process.env.NODE_ENV !== 'test') {
  serverInstance = server.listen(PORT, () => {
    logger.info(`Backend HTTP server is running on port: ${PORT}`);
  });
}

// Graceful shutdown logic for nodemon (SIGUSR2) and manual kill (SIGINT/SIGTERM)
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (serverInstance) {
    serverInstance.close(() => logger.info('HTTP server closed.'));
  }
  const redisClient = (await import('./utils/redisClient.js')).default;
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis connection closed.');
  }
  process.exit(0);
};

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { app, server, io };
