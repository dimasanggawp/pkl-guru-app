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
import { Users, CheckCircle2, BookCheck, Clock } from 'lucide-react';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';
import { useChartColors } from '../hooks/useChartColors';

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
  const colors = useChartColors();

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
          backgroundColor: [colors.success, colors.warning, colors.info, colors.danger],
          borderWidth: 0,
        },
      ],
    }),
    [stats, colors]
  );

  const weeklyActivityData = useMemo(
    () => ({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Hadir',
          data: stats?.weeklyPresence || [0, 0, 0, 0, 0, 0, 0],
          borderColor: colors.success,
          backgroundColor: colors.success,
          tension: 0.3,
        },
        {
          label: 'Tanpa Keterangan',
          data: stats?.weeklyAlpha || [0, 0, 0, 0, 0, 0, 0],
          borderColor: colors.danger,
          backgroundColor: colors.danger,
          tension: 0.3,
        },
      ],
    }),
    [stats, colors]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: colors.text } },
    },
  };

  if (loading) return <p className="text-muted">Memuat dashboard...</p>;

  const statCards = [
    { label: 'Total Siswa', value: stats?.totalStudents || 0, icon: Users, accent: 'text-primary' },
    { label: 'Hadir Hari Ini', value: stats?.hadirToday || 0, icon: CheckCircle2, accent: 'text-success' },
    { label: 'Jurnal Ditinjau', value: stats?.journalReviewedCount || 0, icon: BookCheck, accent: 'text-info' },
    { label: 'Menunggu Review', value: stats?.pendingReviewCount || 0, icon: Clock, accent: 'text-warning' },
  ];

  return (
    <div>
      <p className="kicker mb-1">Ringkasan</p>
      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Dashboard Monitoring</h1>

      {error && (
        <div className="mb-6 p-4 bg-warning-soft border border-border rounded-md text-sm text-warning">
          Data dashboard belum tersedia: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flat-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="kicker">{card.label}</h3>
                <Icon size={20} className={card.accent} />
              </div>
              <p className="text-3xl font-display font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flat-card">
          <h2 className="text-lg font-display font-bold mb-4">Ringkasan Kehadiran</h2>
          <div className="h-64">
            <Pie data={presenceChartData} options={chartOptions} />
          </div>
        </div>

        <div className="flat-card">
          <h2 className="text-lg font-display font-bold mb-4">Aktivitas Mingguan</h2>
          <div className="h-64">
            <Line
              data={weeklyActivityData}
              options={{
                ...chartOptions,
                scales: {
                  y: { beginAtZero: true, ticks: { color: colors.text }, grid: { color: colors.grid } },
                  x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
