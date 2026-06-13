import { useState, useMemo, useEffect } from 'react';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';

function formatAlertDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  try {
    return new Date(dateStr).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
}

function getAlertIcon(type) {
  switch (type) {
    case 'geofence_exit':
      return '⚠️';
    case 'geofence_entry':
      return '✅';
    case 'journal_pending':
      return '📋';
    default:
      return '🔔';
  }
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await API.get('/guru/alerts', { params: { status: filter } });
        setAlerts(response.data?.data || response.data || []);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [filter, refreshKey]);

  const handleMarkAsRead = async (alertId) => {
    try {
      await API.patch(`/guru/alerts/${alertId}/read`, {});
      setRefreshKey((key) => key + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Alerts Center</h1>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            {unreadCount} belum dibaca
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Data alert belum tersedia: {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          Belum Dibaca
        </button>
        <button
          onClick={() => setFilter('geofence')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'geofence' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          Geofence
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div>Memuat alerts...</div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 cursor-pointer transition ${
                alert.read
                  ? 'bg-gray-50 border-l-gray-300'
                  : 'bg-blue-50 border-l-blue-500 hover:shadow-md'
              }`}
              onClick={() => !alert.read && handleMarkAsRead(alert.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3 flex-1">
                  <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                  <div>
                    <p className="font-bold">{alert.title || 'Geofencing Alert'}</p>
                    <p className="text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatAlertDate(alert.createdAt || alert.tanggal)}
                    </p>
                  </div>
                </div>
                {!alert.read && <span className="w-3 h-3 bg-blue-500 rounded-full mt-1.5"></span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Tidak ada alert.
        </div>
      )}
    </div>
  );
}
