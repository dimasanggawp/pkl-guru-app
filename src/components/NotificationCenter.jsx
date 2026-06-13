import { useContext } from 'react';
import { NotificationContext } from '../contexts/notification-context';

export default function NotificationCenter() {
  const { notifications, removeNotification } = useContext(NotificationContext);

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg text-white animate-slide-in ${
            notification.type === 'alert'
              ? 'bg-red-500'
              : notification.type === 'success'
              ? 'bg-green-500'
              : notification.type === 'warning'
              ? 'bg-yellow-500'
              : 'bg-blue-500'
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
