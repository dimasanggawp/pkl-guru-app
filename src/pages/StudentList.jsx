import { useState, useEffect, useMemo } from 'react';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await API.get('/guru/siswa', {
          params: { search, status: statusFilter },
        });
        setStudents(response.data?.data || response.data || []);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [search, statusFilter]);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          (student.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (student.nisn || '').includes(search)
      ),
    [students, search]
  );

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'hadir':
        return 'badge-success';
      case 'sakit':
        return 'badge-warning';
      case 'izin':
        return 'badge-info';
      default:
        return 'badge-danger';
    }
  };

  return (
    <div>
      <p className="kicker mb-1">Data</p>
      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Daftar Siswa</h1>

      {error && (
        <div className="mb-6 p-4 bg-warning-soft border border-border rounded-md text-sm text-warning">
          Data siswa belum tersedia: {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Cari nama atau NISN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field-input sm:w-48"
        >
          <option value="all">Semua Status</option>
          <option value="hadir">Hadir</option>
          <option value="sakit">Sakit</option>
          <option value="izin">Izin</option>
          <option value="alpha">Alpha</option>
        </select>
      </div>

      {/* Student Table */}
      {loading ? (
        <p className="text-muted">Memuat data siswa...</p>
      ) : (
        <div className="flat-panel overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-surface-alt border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-display">NISN</th>
                <th className="px-6 py-3 text-left font-display">Nama</th>
                <th className="px-6 py-3 text-left font-display">Tempat PKL</th>
                <th className="px-6 py-3 text-left font-display">Status Hari Ini</th>
                <th className="px-6 py-3 text-left font-display">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-surface-alt">
                    <td className="px-6 py-3">{student.nisn}</td>
                    <td className="px-6 py-3">{student.name}</td>
                    <td className="px-6 py-3">{student.company}</td>
                    <td className="px-6 py-3">
                      <span className={statusBadgeClass(student.todayStatus)}>
                        {student.todayStatus || 'belum presensi'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button className="text-primary font-semibold hover:underline">Lihat</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-muted">
                    Tidak ada siswa ditemukan.
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
