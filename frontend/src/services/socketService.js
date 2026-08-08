import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: false });
    this.connecting = false;
    this.roomQueue = []; // Queue for rooms to join upon connection
  }

  connect(userId, userType) {
    if (this.socket && this.socket.connected) {
      console.log('SocketService: Already connected.');
      // Ensure the user joins their specific room even if already connected (e.g. background reconnects)
      if (userId && userType) {
        this.joinRoom(`${userType}_${userId}`);
      }
      return;
    }
    if (this.connecting) {
      console.log('SocketService: Connection already in progress.');
      return;
    }

    this.connecting = true;
    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('SocketService: Connected. Socket ID:', this.socket.id);
      this.connecting = false;
      
      // Join the user-specific room
      if (userId && userType) {
        this.joinRoom(`${userType}_${userId}`);
      }

      // Process any pending room joins
      this.processRoomQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService: Disconnected. Reason:', reason);
      this.connecting = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('SocketService: Connection error:', err.message);
      this.connecting = false;
    });
  }

  joinRoom(roomName) {
    if (this.socket && this.socket.connected) {
      console.log(`SocketService: Joining room: ${roomName}`);
      this.socket.emit('join_room', roomName);
    } else {
      console.warn(`SocketService: Socket not connected. Queuing join for room: ${roomName}`);
      // Add to queue if not already there
      if (!this.roomQueue.includes(roomName)) {
        this.roomQueue.push(roomName);
      }
    }
  }

  processRoomQueue() {
    if (this.socket && this.socket.connected) {
      while(this.roomQueue.length > 0) {
        const roomName = this.roomQueue.shift();
        this.joinRoom(roomName);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('SocketService: Disconnecting socket.');
      this.socket.disconnect();
      this.connecting = false; // Ensure flag is reset on manual disconnect
    }
  }

  emit(event, data) {
    if (this.socket) {
      console.log(`SocketService: Emitting event '${event}' with data:`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`SocketService: Cannot emit '${event}'. Socket not connected.`);
    }
  }

  on(event, callback) {
    if (this.socket) {
      console.log(`SocketService: Registering listener for event: ${event}`);
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      console.log(`SocketService: De-registering listener for event: ${event}`);
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();