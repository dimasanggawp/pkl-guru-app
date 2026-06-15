import { useContext } from 'react';
import { NotificationContext } from '../contexts/notification-context';

export default function NotificationCenter() {
  const { notifications, removeNotification } = useContext(NotificationContext);

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-md text-white animate-slide-in ${
            notification.type === 'alert'
              ? 'bg-danger'
              : notification.type === 'success'
              ? 'bg-success'
              : notification.type === 'warning'
              ? 'bg-warning'
              : 'bg-info'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold">{notification.title}</p>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-lg opacity-75 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
