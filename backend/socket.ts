import { Server } from 'socket.io';
import { handleRestaurantSocketEvents } from '@/socketHandlers/restaurantSocketHandler.js';
import redisClient from '@/utils/redisClient.js';
import env from '@/config/env.js';

let io: import('socket.io').Server | undefined;

const allowedOrigins = env.CORS_ORIGINS?.split(',') || [env.FRONTEND_URL];

export const initSocket = (server: import('http').Server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io?.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}.`);
    });

    // Register restaurant-specific socket event handlers
    handleRestaurantSocketEvents(socket);

    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('update_location', async (data) => {
      // data should contain { orderId, riderId, latitude, longitude }
      if (data.orderId) {
        // Broadcast to the specific order's room
        io?.to(data.orderId.toString()).emit('rider_location_update', data);
      }

      // Save rider's real-time location to Redis for dispatch matching
      if (data.riderId && data.longitude && data.latitude) {
        try {
          await redisClient.geoAdd('active_riders', {
            longitude: data.longitude,
            latitude: data.latitude,
            member: data.riderId.toString(),
          });
          // Set TTL so rider drops from dispatch pool if they disconnect for 2 mins
          await redisClient.set(`rider_active:${data.riderId}`, '1', { EX: 120 });
        } catch (err) {
          console.error('Redis geoAdd error:', err);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
