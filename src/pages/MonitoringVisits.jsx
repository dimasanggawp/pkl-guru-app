import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';
import { compressImage } from '../utils/imageCompression';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const FILE_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(
  /\/api\/?$/,
  ''
);

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
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [photosMonitoring, setPhotosMonitoring] = useState([]);
  const [photosForm, setPhotosForm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [compressing, setCompressing] = useState(false);

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

  const handlePhotoCapture = async (e, setPhotos) => {
    const files = Array.from(e.target.files);
    e.target.value = '';

    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        showError(`File ${file.name} terlalu besar (maks 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setCompressing(true);
    try {
      const compressed = await Promise.all(
        validFiles.map((file) => compressImage(file).catch(() => file))
      );
      setPhotos((prev) => [...prev, ...compressed]);
    } finally {
      setCompressing(false);
    }
  };

  const handleRemovePhoto = (setPhotos, idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter((student) => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return true;
    const name = (student.name || student.nama || '').toLowerCase();
    const nisn = String(student.nisn || '').toLowerCase();
    return name.includes(q) || nisn.includes(q);
  });

  const handleSubmitVisit = async () => {
    if (selectedStudents.length === 0) {
      showError('Pilih minimal satu siswa');
      return;
    }
    if (!notes.trim()) {
      showError('Catatan kunjungan tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        selectedStudents.map((siswaId) => {
          const formData = new FormData();
          formData.append('siswa_id', siswaId);
          formData.append('notes', notes);
          photosMonitoring.forEach((photo) => formData.append('photos_monitoring', photo));
          photosForm.forEach((photo) => formData.append('photos_form', photo));
          return API.post('/guru/visits', formData);
        })
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length === 0) {
        showSuccess(`Kunjungan berhasil disimpan untuk ${selectedStudents.length} siswa`);
      } else if (failed.length < results.length) {
        showError(`${failed.length} dari ${results.length} siswa gagal disimpan`);
      } else {
        showError(getErrorMessage(failed[0].reason));
      }

      setSelectedStudents([]);
      setStudentSearch('');
      setNotes('');
      setPhotosMonitoring([]);
      setPhotosForm([]);
      setShowForm(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-muted">Memuat data...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="kicker mb-1">Lapangan</p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Monitoring Visits</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
          {showForm ? 'Batal' : 'Catat Kunjungan'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-warning-soft border border-border rounded-md text-sm text-warning">
          Data kunjungan belum tersedia: {error}
        </div>
      )}

      {showForm && (
        <div className="flat-card mb-6">
          <h2 className="text-xl font-display font-bold mb-4">Catat Kunjungan Monitoring</h2>

          <div className="space-y-4">
            <div>
              <label className="field-label">
                Pilih Siswa {selectedStudents.length > 0 && `(${selectedStudents.length} dipilih)`}
              </label>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Cari nama/NISN..."
                className="field-input mb-2"
              />
              <div className="max-h-56 overflow-y-auto border border-border rounded-md divide-y divide-border">
                {filteredStudents.length === 0 && (
                  <p className="text-sm text-muted p-3">Tidak ada siswa ditemukan.</p>
                )}
                {filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-surface-alt"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <span className="text-sm">
                      {student.name || student.nama} - {student.nisn}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Catatan Kunjungan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="4"
                className="field-input"
                placeholder="Catat hasil observasi selama monitoring..."
              />
            </div>

            <div>
              <label className="field-label">Foto Monitoring dengan Siswa</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoCapture(e, setPhotosMonitoring)}
                disabled={compressing}
                className="field-input"
              />
              {photosMonitoring.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted mb-2">{photosMonitoring.length} foto dipilih</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photosMonitoring.map((photo, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview monitoring ${idx}`}
                          className="w-full h-20 object-cover rounded-md border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(setPhotosMonitoring, idx)}
                          className="absolute top-1 right-1 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="field-label">Foto Form/Lembar Monitoring</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoCapture(e, setPhotosForm)}
                disabled={compressing}
                className="field-input"
              />
              {photosForm.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted mb-2">{photosForm.length} foto dipilih</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photosForm.map((photo, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview form ${idx}`}
                          className="w-full h-20 object-cover rounded-md border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(setPhotosForm, idx)}
                          className="absolute top-1 right-1 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {compressing && <p className="text-sm text-muted">Mengompres foto...</p>}

            <button
              onClick={handleSubmitVisit}
              disabled={submitting || compressing}
              className="btn-accent w-full"
            >
              {submitting
                ? 'Menyimpan...'
                : selectedStudents.length > 1
                  ? `Simpan Kunjungan (${selectedStudents.length} Siswa)`
                  : 'Simpan Kunjungan'}
            </button>
          </div>
        </div>
      )}

      {visits.length > 0 ? (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div key={visit.id} className="flat-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display font-bold text-lg">{visit.student_name || visit.Siswa?.nama}</h3>
                  <p className="text-sm text-muted">{visit.nisn || visit.Siswa?.nisn}</p>
                </div>
                <span className="text-sm text-muted">
                  {formatVisitDate(visit.visit_date || visit.created_at)}
                </span>
              </div>
              <p className="text-ink mb-3">{visit.notes}</p>
              {Array.isArray(visit.photos) && visit.photos.length > 0 && (
                <>
                  {['monitoring', 'form'].map((tipe) => {
                    const groupPhotos = visit.photos.filter((photo) => photo.tipe_foto === tipe);
                    if (groupPhotos.length === 0) return null;
                    return (
                      <div key={tipe} className="mb-3 last:mb-0">
                        <p className="text-xs text-muted mb-1">
                          {tipe === 'monitoring' ? 'Foto Monitoring dengan Siswa' : 'Foto Form/Lembar Monitoring'}
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {groupPhotos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo.path.startsWith('http') ? photo.path : `${FILE_BASE_URL}${photo.path}`}
                              alt={`Foto kunjungan ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-md border border-border"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flat-card text-center text-muted">Belum ada riwayat kunjungan.</div>
      )}
    </div>
  );
}
