import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import API from '../../services/api';
import { showError, getErrorMessage } from '../../services/toastService';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon (Leaflet issue with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [-6.2088, 106.8456]; // Jakarta default
const GEOFENCE_RADIUS = 100; // meters

export default function MonitoringMap() {
  const [zones, setZones] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const [zonesRes, studentsRes] = await Promise.all([
          API.get('/guru/zones'),
          API.get('/guru/students/locations'),
        ]);
        setZones(zonesRes.data?.data || zonesRes.data || []);
        setStudents(studentsRes.data?.data || studentsRes.data || []);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoringData();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStudents = useMemo(
    () => (selectedZone ? students.filter((s) => s.zoneId === selectedZone) : students),
    [students, selectedZone]
  );

  if (loading) return <p className="text-muted">Memuat peta monitoring...</p>;

  const mapCenter =
    zones.length > 0 ? [zones[0].latitude, zones[0].longitude] : DEFAULT_CENTER;

  return (
    <div className="flex flex-col sm:flex-row h-[calc(100vh-12rem)] gap-4">
      {/* Sidebar - Zone List */}
      <div className="w-full sm:w-72 flat-panel overflow-y-auto">
        {error && (
          <div className="m-4 p-3 bg-warning-soft border border-border rounded-md text-xs text-warning">
            Data monitoring belum tersedia: {error}
          </div>
        )}

        <div className="p-4">
          <h2 className="font-display font-bold text-lg mb-3">Zona</h2>
          <button
            onClick={() => setSelectedZone(null)}
            className={`w-full text-left p-3 rounded-md mb-2 transition ${
              selectedZone === null ? 'bg-primary text-white' : 'bg-surface-alt text-ink hover:bg-border'
            }`}
          >
            Semua Zona ({students.length})
          </button>
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`w-full text-left p-3 rounded-md mb-2 transition ${
                selectedZone === zone.id ? 'bg-primary text-white' : 'bg-surface-alt text-ink hover:bg-border'
              }`}
            >
              <div className="font-semibold">{zone.name}</div>
              <div className="text-sm opacity-80">
                {students.filter((s) => s.zoneId === zone.id).length} siswa
              </div>
            </button>
          ))}
          {zones.length === 0 && <p className="text-sm text-muted">Belum ada data zona.</p>}
        </div>

        {/* Student List */}
        <div className="p-4 border-t border-border">
          <h3 className="font-display font-bold mb-3">Siswa</h3>
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-3 bg-surface-alt rounded-md text-sm">
                <div className="font-semibold">{student.name}</div>
                <div
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    student.inGeofence ? 'text-success' : 'text-danger'
                  }`}
                >
                  {student.inGeofence ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  {student.inGeofence ? 'Dalam Zona' : 'Luar Zona'}
                </div>
                <div className="text-xs text-muted">
                  {Number(student.distance || 0).toFixed(0)}m
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <p className="text-sm text-muted">Belum ada data siswa.</p>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 flat-panel overflow-hidden">
        <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Work Zones - Green circles */}
          {zones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={zone.radius || GEOFENCE_RADIUS}
              color="#3F8F5B"
              fillColor="#3F8F5B"
              fillOpacity={0.15}
              eventHandlers={{ click: () => setSelectedZone(zone.id) }}
            >
              <Popup>
                <div className="text-center">
                  <strong>{zone.name}</strong>
                  <br />
                  Radius: {zone.radius || GEOFENCE_RADIUS}m
                  <br />
                  Siswa: {students.filter((s) => s.zoneId === zone.id).length}
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Student Markers */}
          {filteredStudents.map((student) => (
            <Marker key={student.id} position={[student.latitude, student.longitude]}>
              <Popup>
                <div>
                  <strong>{student.name}</strong>
                  <br />
                  Zona: {student.zoneName || 'Unknown'}
                  <br />
                  Status: {student.inGeofence ? 'Dalam Zona' : 'Luar Zona'}
                  <br />
                  Jarak: {Number(student.distance || 0).toFixed(2)}m
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
