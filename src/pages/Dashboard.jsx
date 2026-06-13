import { useState, useEffect, useMemo } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await API.get('/guru/dashboard');
        setStats(response.data?.data || response.data);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const presenceChartData = useMemo(
    () => ({
      labels: ['Hadir', 'Sakit', 'Izin', 'Alpha'],
      datasets: [
        {
          data: [
            Number(stats?.hadirCount) || 0,
            Number(stats?.sakitCount) || 0,
            Number(stats?.izinCount) || 0,
            Number(stats?.alphaCount) || 0,
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
          borderColor: ['#059669', '#D97706', '#1D4ED8', '#DC2626'],
          borderWidth: 2,
        },
      ],
    }),
    [stats]
  );

  const weeklyActivityData = useMemo(
    () => ({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Hadir',
          data: stats?.weeklyPresence || [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Tanpa Keterangan',
          data: stats?.weeklyAlpha || [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
      ],
    }),
    [stats]
  );

  if (loading) return <div className="p-6">Memuat dashboard...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard Monitoring</h1>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Data dashboard belum tersedia: {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Siswa</h3>
          <p className="text-2xl font-bold mt-2">{stats?.totalStudents || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Hadir Hari Ini</h3>
          <p className="text-2xl font-bold mt-2 text-green-600">{stats?.hadirToday || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Jurnal Ditinjau</h3>
          <p className="text-2xl font-bold mt-2">{stats?.journalReviewedCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Menunggu Review</h3>
          <p className="text-2xl font-bold mt-2 text-yellow-600">
            {stats?.pendingReviewCount || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Ringkasan Kehadiran</h2>
          <div className="h-64">
            <Pie
              data={presenceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Aktivitas Mingguan</h2>
          <div className="h-64">
            <Line
              data={weeklyActivityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
