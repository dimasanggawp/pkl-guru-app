import { useState, useEffect } from 'react';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

export default function PresensiHarian() {
  const [tanggal, setTanggal] = useState(todayISODate());
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPresensi = async () => {
      setLoading(true);
      try {
        const response = await API.get('/guru/presensi', { params: { tanggal } });
        setSiswa(response.data?.data?.siswa || []);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
        setSiswa([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPresensi();
  }, [tanggal]);

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'hadir':
        return 'badge-success';
      case 'sakit':
        return 'badge-warning';
      case 'izin':
        return 'badge-info';
      case 'alpha':
        return 'badge-danger';
      default:
        return 'badge-danger';
    }
  };

  const statusLabel = (status) => status || 'belum presensi';

  const hadirCount = siswa.filter((s) => s.status === 'hadir').length;

  return (
    <div>
      <p className="kicker mb-1">Data</p>
      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Presensi Harian</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <label className="field-label" htmlFor="tanggal">
            Tanggal
          </label>
          <input
            id="tanggal"
            type="date"
            value={tanggal}
            max={todayISODate()}
            onChange={(e) => setTanggal(e.target.value)}
            className="field-input"
          />
        </div>
        {!loading && (
          <p className="text-muted text-sm">
            {hadirCount} dari {siswa.length} siswa hadir pada tanggal ini
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-warning-soft border border-border rounded-md text-sm text-warning">
          Data presensi belum tersedia: {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Memuat data presensi...</p>
      ) : (
        <div className="flat-panel overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-surface-alt border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-display">NISN</th>
                <th className="px-6 py-3 text-left font-display">Nama</th>
                <th className="px-6 py-3 text-left font-display">Kelas</th>
                <th className="px-6 py-3 text-left font-display">Status</th>
                <th className="px-6 py-3 text-left font-display">Jam Masuk</th>
                <th className="px-6 py-3 text-left font-display">Jam Keluar</th>
              </tr>
            </thead>
            <tbody>
              {siswa.length > 0 ? (
                siswa.map((s) => (
                  <tr key={s.siswa_id} className="border-b border-border hover:bg-surface-alt">
                    <td className="px-6 py-3">{s.nisn}</td>
                    <td className="px-6 py-3">{s.nama}</td>
                    <td className="px-6 py-3">{s.kelas}</td>
                    <td className="px-6 py-3">
                      <span className={statusBadgeClass(s.status)}>{statusLabel(s.status)}</span>
                    </td>
                    <td className="px-6 py-3">{s.jam_masuk || '-'}</td>
                    <td className="px-6 py-3">{s.jam_keluar || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-muted">
                    Tidak ada siswa binaan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
