import { useState, useEffect } from 'react';
import API from '../../services/api';
import { showSuccess, showError, getErrorMessage } from '../../services/toastService';

const FILE_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(
  /\/api\/?$/,
  ''
);

const STATUS_META = {
  pending: { label: 'Menunggu', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning-soft' },
  approved: { label: 'Disetujui', dot: 'bg-success', text: 'text-success', bg: 'bg-success-soft' },
  rejected: { label: 'Ditolak', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger-soft' },
  under_revision: { label: 'Revisi', dot: 'bg-info', text: 'text-info', bg: 'bg-info-soft' },
};

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.pending;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

function timeAgo(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(dateString);
}

export default function JournalReview() {
  const [view, setView] = useState('pending');
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true);
      setSelectedJournal(null);
      try {
        const response = await API.get('/guru/jurnal/pending', { params: { view } });
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

    fetchJournals();
  }, [view, refreshKey]);

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

  const images = selectedJournal?.images || (selectedJournal?.foto_path ? [selectedJournal.foto_path] : []);
  const selectedSiswa = selectedJournal?.Siswa;
  const selectedMeta = selectedJournal ? statusMeta(selectedJournal.status) : null;

  return (
    <div>
      <p className="kicker mb-1">Pengawasan</p>
      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Review Jurnal</h1>

      {/* View switcher */}
      <div className="inline-flex p-1 mb-6 rounded-md bg-surface-alt border border-border">
        <button
          type="button"
          onClick={() => setView('pending')}
          className={`px-4 py-2 rounded text-sm font-semibold transition ${
            view === 'pending' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
          }`}
        >
          Menunggu Review
        </button>
        <button
          type="button"
          onClick={() => setView('reviewed')}
          className={`px-4 py-2 rounded text-sm font-semibold transition ${
            view === 'reviewed' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
          }`}
        >
          Sudah Direview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journal List */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-ink">
              {view === 'pending' ? 'Menunggu Review' : 'Sudah Direview'}
            </h2>
            <span className="text-xs font-semibold text-muted bg-surface-alt border border-border rounded-full px-2.5 py-0.5">
              {journals.length}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-warning-soft border border-border rounded-md text-xs text-warning">
              Data jurnal belum tersedia: {error}
            </div>
          )}

          {loading ? (
            <div className="flat-panel p-6 text-center text-sm text-muted">Memuat jurnal...</div>
          ) : (
            <div className="flat-panel divide-y divide-border overflow-hidden max-h-[70vh] overflow-y-auto">
              {journals.length > 0 ? (
                journals.map((journal) => {
                  const meta = statusMeta(journal.status);
                  const isSelected = selectedJournal?.id === journal.id;
                  const thumb = journal.foto_path
                    ? journal.foto_path.startsWith('http')
                      ? journal.foto_path
                      : `${FILE_BASE_URL}${journal.foto_path}`
                    : null;

                  return (
                    <button
                      key={journal.id}
                      onClick={() => {
                        setSelectedJournal(journal);
                        setStatus('');
                        setFeedback('');
                      }}
                      className={`w-full text-left flex gap-3 p-4 transition hover:bg-surface-alt relative ${
                        isSelected ? 'bg-primary-soft' : ''
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-1 ${meta.dot}`}
                        aria-hidden="true"
                      />
                      <span className="shrink-0 h-10 w-10 rounded-full bg-accent-soft text-accent flex items-center justify-center font-display font-bold text-sm">
                        {initials(journal.Siswa?.nama)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-ink truncate">
                            {journal.Siswa?.nama || 'Tidak diketahui'}
                          </p>
                          <span
                            className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted">{journal.Siswa?.kelas}</p>
                        <p className="text-sm text-ink/80 mt-1 line-clamp-2">{journal.deskripsi}</p>
                        <p className="text-xs text-muted mt-1">
                          {view === 'pending'
                            ? timeAgo(journal.created_at)
                            : `Direview ${timeAgo(journal.reviewed_at)}`}
                        </p>
                      </div>
                      {thumb && (
                        <img
                          src={thumb}
                          alt=""
                          className="shrink-0 h-14 w-14 rounded-md object-cover border border-border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-sm text-muted">
                  {view === 'pending'
                    ? 'Tidak ada jurnal yang menunggu review.'
                    : 'Belum ada jurnal yang direview.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail / Review Panel */}
        <div className="lg:col-span-2">
          {selectedJournal ? (
            <div className="flat-card">
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted mb-1">
                    {selectedSiswa?.nama} &middot; {selectedSiswa?.kelas}
                  </p>
                  <h2 className="text-xl font-display font-bold text-ink">
                    Jurnal {formatDate(selectedJournal.tanggal)}
                  </h2>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${selectedMeta.bg} ${selectedMeta.text}`}
                >
                  {selectedMeta.label}
                </span>
              </div>

              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-ink whitespace-pre-wrap">{selectedJournal.deskripsi}</p>

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

              {view === 'reviewed' ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted">Direview pada {formatDate(selectedJournal.reviewed_at)}</p>
                  {selectedJournal.status === 'rejected' && selectedJournal.rejection_reason && (
                    <div>
                      <p className="field-label">Alasan penolakan</p>
                      <p className="text-ink bg-danger-soft border border-border rounded-md p-3 text-sm">
                        {selectedJournal.rejection_reason}
                      </p>
                    </div>
                  )}
                  {selectedJournal.guru_feedback && (
                    <div>
                      <p className="field-label">Catatan guru</p>
                      <p className="text-ink bg-surface-alt border border-border rounded-md p-3 text-sm">
                        {selectedJournal.guru_feedback}
                      </p>
                    </div>
                  )}
                  {!selectedJournal.guru_feedback && !selectedJournal.rejection_reason && (
                    <p className="text-sm text-muted">Tidak ada catatan tambahan.</p>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          ) : (
            <div className="flat-card text-center text-muted py-16">
              Pilih jurnal di sebelah kiri untuk melihat detail
              {view === 'pending' ? ' dan memberikan review.' : '.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
