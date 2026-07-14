import { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5.5" fill="#fff"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const TEMPAT_PKL_ICON = pinIcon('#2563EB');
const PRESENSI_ICON = pinIcon('#DC2626');

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 2) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

function JarakMapModal({ row, onClose }) {
  const presensiPoint = [Number(row.lat_masuk), Number(row.lon_masuk)];
  const tempatPoint = [Number(row.tempat_pkl.lat), Number(row.tempat_pkl.lon)];
  const points = [presensiPoint, tempatPoint];
  const jarakLabel =
    row.jarak_meter >= 1000 ? `${(row.jarak_meter / 1000).toFixed(2)} km` : `${row.jarak_meter} m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flat-panel w-full max-w-lg space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink">Jarak Presensi - {row.nama}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
        <p className="text-sm text-muted">
          Jarak garis lurus (Haversine) antara lokasi check-in dan{' '}
          <span className="font-medium text-ink">{row.tempat_pkl.nama}</span>:{' '}
          <span className={row.jarak_meter > 100 ? 'text-danger font-semibold' : 'text-success font-semibold'}>
            {jarakLabel}
          </span>
        </p>
        <div className="h-80 w-full overflow-hidden rounded border border-border">
          <MapContainer center={presensiPoint} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={presensiPoint} icon={PRESENSI_ICON}>
              <Popup>Lokasi presensi {row.nama}</Popup>
            </Marker>
            <Marker position={tempatPoint} icon={TEMPAT_PKL_ICON}>
              <Popup>Tempat PKL: {row.tempat_pkl.nama}</Popup>
            </Marker>
            <Polyline positions={points} pathOptions={{ color: '#EF4444', dashArray: '6 6', weight: 3 }} />
            <FitBounds points={points} />
          </MapContainer>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-white"
              style={{ backgroundColor: '#DC2626' }}
            />
            Lokasi presensi siswa
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-white"
              style={{ backgroundColor: '#2563EB' }}
            />
            Tempat PKL
          </span>
        </div>
        <p className="text-xs text-muted">
          Garis putus-putus merah menunjukkan jarak lurus, bukan rute jalan sebenarnya.
        </p>
      </div>
    </div>
  );
}

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

function formatJamUpload(value) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function PresensiHarian() {
  const [tanggal, setTanggal] = useState(todayISODate());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kelasFilter, setKelasFilter] = useState('all');
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRow, setMapRow] = useState(null);

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

  const kelasOptions = useMemo(
    () => Array.from(new Set(siswa.map((s) => s.kelas).filter(Boolean))).sort(),
    [siswa]
  );

  const filteredSiswa = useMemo(
    () =>
      siswa.filter((s) => {
        const matchSearch =
          (s.nama || '').toLowerCase().includes(search.toLowerCase()) || (s.nisn || '').includes(search);
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'sudah' && !!s.status) ||
          (statusFilter === 'belum' && !s.status);
        const matchKelas = kelasFilter === 'all' || s.kelas === kelasFilter;
        return matchSearch && matchStatus && matchKelas;
      }),
    [siswa, search, statusFilter, kelasFilter]
  );

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
        return 'badge-neutral';
    }
  };

  const hadirCount = siswa.filter((s) => s.status === 'hadir').length;
  const izinSakitCount = siswa.filter((s) => s.status === 'izin' || s.status === 'sakit').length;
  const alphaCount = siswa.filter((s) => s.status === 'alpha').length;
  const belumCount = siswa.filter((s) => !s.status).length;

  return (
    <div>
      <p className="kicker mb-1">Data</p>
      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Presensi Harian</h1>

      {error && (
        <div className="mb-6 p-4 bg-warning-soft border border-border rounded-md text-sm text-warning">
          Data presensi belum tersedia: {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="flat-card p-4">
          <p className="text-sm text-muted">Hadir</p>
          <p className="text-2xl font-display font-bold text-ink">{hadirCount}</p>
        </div>
        <div className="flat-card p-4">
          <p className="text-sm text-muted">Izin/Sakit</p>
          <p className="text-2xl font-display font-bold text-ink">{izinSakitCount}</p>
        </div>
        <div className="flat-card p-4">
          <p className="text-sm text-muted">Alpha</p>
          <p className="text-2xl font-display font-bold text-ink">{alphaCount}</p>
        </div>
        <div className="flat-card p-4">
          <p className="text-sm text-muted">Belum Presensi</p>
          <p className="text-2xl font-display font-bold text-ink">{belumCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mb-6">
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
        <div>
          <label className="field-label" htmlFor="statusFilter">
            Status Presensi
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field-input"
          >
            <option value="all">Semua</option>
            <option value="sudah">Sudah Presensi</option>
            <option value="belum">Belum Presensi</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="kelasFilter">
            Kelas
          </label>
          <select
            id="kelasFilter"
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="field-input"
          >
            <option value="all">Semua Kelas</option>
            {kelasOptions.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="field-label" htmlFor="search">
            Cari
          </label>
          <input
            id="search"
            type="text"
            placeholder="Cari nama atau NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input w-full"
          />
        </div>
      </div>

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
                <th className="px-6 py-3 text-left font-display">Jam Upload Jurnal</th>
                <th className="px-6 py-3 text-left font-display">Lokasi Presensi</th>
                <th className="px-6 py-3 text-left font-display">Jarak ke Tempat PKL</th>
              </tr>
            </thead>
            <tbody>
              {filteredSiswa.length > 0 ? (
                filteredSiswa.map((s) => {
                  const jarak = s.jarak_meter;
                  const jarakLabel =
                    jarak == null ? null : jarak >= 1000 ? `${(jarak / 1000).toFixed(2)} km` : `${jarak} m`;
                  const isFar = jarak != null && jarak > 100;
                  const canShowMap =
                    s.lat_masuk != null && s.lon_masuk != null && s.tempat_pkl?.lat != null && s.tempat_pkl?.lon != null;

                  return (
                    <tr key={s.siswa_id} className="border-b border-border hover:bg-surface-alt">
                      <td className="px-6 py-3">{s.nisn}</td>
                      <td className="px-6 py-3">{s.nama}</td>
                      <td className="px-6 py-3">{s.kelas}</td>
                      <td className="px-6 py-3">
                        <span className={statusBadgeClass(s.status)}>{s.status || 'belum presensi'}</span>
                      </td>
                      <td className="px-6 py-3">{s.jam_masuk || '-'}</td>
                      <td className="px-6 py-3">{formatJamUpload(s.jam_upload_jurnal)}</td>
                      <td className="px-6 py-3">
                        {s.lat_masuk != null && s.lon_masuk != null ? (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${s.lat_masuk}&mlon=${s.lon_masuk}#map=17/${s.lat_masuk}/${s.lon_masuk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                            title="Lihat di peta"
                          >
                            <MapPin size={14} />
                            <span>
                              {Number(s.lat_masuk).toFixed(6)}, {Number(s.lon_masuk).toFixed(6)}
                            </span>
                          </a>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {jarakLabel == null ? (
                          <span className="text-muted">-</span>
                        ) : canShowMap ? (
                          <button
                            type="button"
                            onClick={() => setMapRow(s)}
                            className={`font-medium underline decoration-dotted hover:opacity-80 ${
                              isFar ? 'text-danger' : 'text-success'
                            }`}
                            title={`Lihat jarak lurus ke ${s.tempat_pkl.nama}`}
                          >
                            {jarakLabel}
                          </button>
                        ) : (
                          <span className={isFar ? 'text-danger font-medium' : 'text-success font-medium'}>
                            {jarakLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-muted">
                    Tidak ada siswa binaan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mapRow && <JarakMapModal row={mapRow} onClose={() => setMapRow(null)} />}
    </div>
  );
}
