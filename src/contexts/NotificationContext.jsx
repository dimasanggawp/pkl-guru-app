import { useState, useEffect, useCallback } from 'react';
import { initSocket, onNotification, onAlert, disconnectSocket } from '../services/socketService';
import { NotificationContext } from './notification-context';

const MAX_NOTIFICATIONS = 10;

export function NotificationProvider({ children, token }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    initSocket(token);

    onNotification((notification) => {
      const id = Date.now();
      setNotifications((prev) => [{ id, type: 'info', ...notification, timestamp: new Date() }, ...prev].slice(0, MAX_NOTIFICATIONS));

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    });

    onAlert((alert) => {
      const id = Date.now();
      setNotifications((prev) => [
        {
          id,
          title: 'Geofencing Alert',
          message: alert.message,
          type: 'alert',
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS));

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 7000);
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  return (
    <NotificationContext.Provider value={{ notifications, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
