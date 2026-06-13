import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(
  /\/api\/?$/,
  ''
);

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('Socket reconnect attempt:', attempt);
    });

    socket.on('reconnect', () => {
      console.log('Socket reconnected');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const onNotification = (callback) => {
  if (socket) {
    socket.off('notification:new');
    socket.on('notification:new', callback);
  }
};

export const onAlert = (callback) => {
  if (socket) {
    socket.off('alert:geofence');
    socket.on('alert:geofence', callback);
  }
};

export const offEvent = (event) => {
  if (socket) {
    socket.off(event);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
