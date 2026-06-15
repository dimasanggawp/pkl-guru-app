import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Bell } from 'lucide-react';
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

function AlertIcon({ type }) {
  switch (type) {
    case 'geofence_exit':
      return <AlertTriangle size={22} className="text-warning" />;
    case 'geofence_entry':
      return <CheckCircle2 size={22} className="text-success" />;
    case 'journal_pending':
      return <ClipboardList size={22} className="text-info" />;
    default:
      return <Bell size={22} className="text-primary" />;
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

  const filters = [
    { key: 'all', label: 'Semua' },
    { key: 'unread', label: 'Belum Dibaca' },
    { key: 'geofence', label: 'Geofence' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="kicker mb-1">Notifikasi</p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Alerts Center</h1>
        </div>
        {unreadCount > 0 && (
          <span className="badge-danger">{unreadCount} belum dibaca</span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-warning-soft border border-border rounded-md text-sm text-warning">
          Data alert belum tersedia: {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn-primary' : 'btn-secondary'}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <p className="text-muted">Memuat alerts...</p>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flat-card cursor-pointer transition border-l-4 ${
                alert.read ? 'border-l-border' : 'border-l-primary hover:bg-surface-alt'
              }`}
              onClick={() => !alert.read && handleMarkAsRead(alert.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3 flex-1">
                  <AlertIcon type={alert.type} />
                  <div>
                    <p className="font-semibold">{alert.title || 'Geofencing Alert'}</p>
                    <p className="text-ink">{alert.message}</p>
                    <p className="text-xs text-muted mt-1">
                      {formatAlertDate(alert.createdAt || alert.tanggal)}
                    </p>
                  </div>
                </div>
                {!alert.read && <span className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5"></span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flat-card text-center text-muted">Tidak ada alert.</div>
      )}
    </div>
  );
}
