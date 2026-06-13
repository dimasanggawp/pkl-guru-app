import { useState, useEffect } from 'react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatVisitDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

export default function MonitoringVisits() {
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visitsRes, studentsRes] = await Promise.all([
          API.get('/guru/visits').catch((e) => {
            throw e;
          }),
          API.get('/guru/siswa').catch(() => ({ data: [] })),
        ]);
        setVisits(visitsRes.data?.data || visitsRes.data || []);
        setStudents(studentsRes.data?.data || studentsRes.data || []);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
        setVisits([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        showError(`File ${file.name} terlalu besar (maks 5MB)`);
        return;
      }
      validFiles.push(file);
    });

    setPhotos((prev) => [...prev, ...validFiles]);
  };

  const handleRemovePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitVisit = async () => {
    if (!selectedStudent) {
      showError('Pilih siswa terlebih dahulu');
      return;
    }
    if (!notes.trim()) {
      showError('Catatan kunjungan tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('siswa_id', selectedStudent);
      formData.append('notes', notes);
      photos.forEach((photo) => formData.append('photos', photo));

      await API.post('/guru/visits', formData);

      showSuccess('Kunjungan berhasil disimpan');
      setSelectedStudent('');
      setNotes('');
      setPhotos([]);
      setShowForm(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Memuat data...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Monitoring Visits</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Batal' : 'Catat Kunjungan'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Data kunjungan belum tersedia: {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Catat Kunjungan Monitoring</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Pilih Siswa</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">-- Pilih siswa --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name || student.nama} - {student.nisn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Catatan Kunjungan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Catat hasil observasi selama monitoring..."
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Lampirkan Foto</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoCapture}
                className="w-full"
              />
              {photos.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">{photos.length} foto dipilih</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${idx}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitVisit}
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Kunjungan'}
            </button>
          </div>
        </div>
      )}

      {/* Visits List */}
      {visits.length > 0 ? (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div key={visit.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{visit.student_name || visit.Siswa?.nama}</h3>
                  <p className="text-sm text-gray-600">{visit.nisn || visit.Siswa?.nisn}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatVisitDate(visit.visit_date || visit.created_at)}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{visit.notes}</p>
              {Array.isArray(visit.photos) && visit.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {visit.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Foto kunjungan ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Belum ada riwayat kunjungan.
        </div>
      )}
    </div>
  );
}
