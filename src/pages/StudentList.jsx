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
        return 'bg-green-100 text-green-700';
      case 'sakit':
        return 'bg-yellow-100 text-yellow-700';
      case 'izin':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Daftar Siswa</h1>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
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
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
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
        <div>Memuat data siswa...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left">NISN</th>
                <th className="px-6 py-3 text-left">Nama</th>
                <th className="px-6 py-3 text-left">Tempat PKL</th>
                <th className="px-6 py-3 text-left">Status Hari Ini</th>
                <th className="px-6 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{student.nisn}</td>
                    <td className="px-6 py-3">{student.name}</td>
                    <td className="px-6 py-3">{student.company}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded text-sm ${statusBadgeClass(
                          student.todayStatus
                        )}`}
                      >
                        {student.todayStatus || 'belum presensi'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button className="text-blue-600 hover:underline">Lihat</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
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
