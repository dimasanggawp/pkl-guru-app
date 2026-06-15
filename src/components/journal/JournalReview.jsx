import { useState, useEffect } from 'react';
import API from '../../services/api';
import { showSuccess, showError, getErrorMessage } from '../../services/toastService';

const FILE_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(
  /\/api\/?$/,
  ''
);

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID');
  } catch {
    return 'Invalid date';
  }
}

export default function JournalReview() {
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPendingJournals = async () => {
      try {
        const response = await API.get('/guru/jurnal/pending');
        setJournals(response.data?.data || response.data || []);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
        setJournals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingJournals();
  }, [refreshKey]);

  const handleSubmitReview = async () => {
    if (!status || !feedback) return;

    setSubmitting(true);
    try {
      if (status === 'approved') {
        await API.post(`/jurnal/${selectedJournal.id}/approve`, { feedback });
      } else if (status === 'rejected') {
        await API.post(`/jurnal/${selectedJournal.id}/reject`, {
          rejection_reason: feedback,
          feedback,
        });
      } else {
        await API.post(`/jurnal/${selectedJournal.id}/revision`, { feedback });
      }

      showSuccess('Review berhasil dikirim');
      setFeedback('');
      setStatus('');
      setSelectedJournal(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-muted">Memuat jurnal...</p>;

  const images = selectedJournal?.images || (selectedJournal?.foto_path ? [selectedJournal.foto_path] : []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Journal List */}
      <div className="lg:col-span-1">
        <h2 className="font-display font-bold text-lg mb-4">Menunggu Review ({journals.length})</h2>

        {error && (
          <div className="mb-4 p-3 bg-warning-soft border border-border rounded-md text-xs text-warning">
            Data jurnal belum tersedia: {error}
          </div>
        )}

        <div className="flat-panel divide-y divide-border">
          {journals.length > 0 ? (
            journals.map((journal) => (
              <button
                key={journal.id}
                onClick={() => setSelectedJournal(journal)}
                className={`w-full text-left p-4 hover:bg-surface-alt transition ${
                  selectedJournal?.id === journal.id ? 'bg-primary-soft' : ''
                }`}
              >
                <p className="font-semibold">
                  {journal.title || journal.deskripsi?.slice(0, 50) || 'Tanpa judul'}
                </p>
                <p className="text-sm text-muted">
                  {journal.siswa_name || journal.Siswa?.nama || 'Tidak diketahui'}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(journal.createdAt || journal.tanggal)}
                </p>
              </button>
            ))
          ) : (
            <div className="p-4 text-sm text-muted">Tidak ada jurnal yang menunggu review.</div>
          )}
        </div>
      </div>

      {/* Review Panel */}
      <div className="lg:col-span-2">
        {selectedJournal ? (
          <div className="flat-card">
            <h2 className="text-xl font-display font-bold mb-4">
              {selectedJournal.title || selectedJournal.deskripsi?.slice(0, 50) || 'Tanpa judul'}
            </h2>

            {/* Journal Content */}
            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-sm text-muted mb-2">
                Oleh: {selectedJournal.siswa_name || selectedJournal.Siswa?.nama || 'Tidak diketahui'}
              </p>
              <p className="text-ink">
                {selectedJournal.content || selectedJournal.deskripsi}
              </p>

              {/* Journal Images */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.startsWith('http') ? img : `${FILE_BASE_URL}${img}`}
                      alt={`Jurnal ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Review Form */}
            <div className="space-y-4">
              <div>
                <label className="field-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="field-input"
                >
                  <option value="">Pilih Aksi</option>
                  <option value="approved">Setujui</option>
                  <option value="rejected">Tolak</option>
                  <option value="under_revision">Minta Revisi</option>
                </select>
              </div>

              <div>
                <label className="field-label">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows="4"
                  className="field-input"
                  placeholder="Tulis catatan untuk siswa..."
                />
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={submitting || !status || !feedback}
                className="btn-primary w-full"
              >
                {submitting ? 'Mengirim...' : 'Kirim Review'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flat-card text-center text-muted">
            Pilih jurnal untuk direview
          </div>
        )}
      </div>
    </div>
  );
}
