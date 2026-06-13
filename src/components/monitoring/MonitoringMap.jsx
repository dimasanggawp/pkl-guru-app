import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
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

  if (loading) return <div className="p-4">Memuat peta monitoring...</div>;

  const mapCenter =
    zones.length > 0 ? [zones[0].latitude, zones[0].longitude] : DEFAULT_CENTER;

  return (
    <div className="flex flex-col sm:flex-row h-[calc(100vh-8rem)]">
      {/* Sidebar - Zone List */}
      <div className="w-full sm:w-64 bg-white shadow-lg overflow-y-auto">
        {error && (
          <div className="m-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            Data monitoring belum tersedia: {error}
          </div>
        )}

        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Zona</h2>
          <button
            onClick={() => setSelectedZone(null)}
            className={`w-full text-left p-3 rounded mb-2 ${
              selectedZone === null ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Semua Zona ({students.length})
          </button>
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`w-full text-left p-3 rounded mb-2 ${
                selectedZone === zone.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <div className="font-semibold">{zone.name}</div>
              <div className="text-sm">
                {students.filter((s) => s.zoneId === zone.id).length} siswa
              </div>
            </button>
          ))}
          {zones.length === 0 && <p className="text-sm text-gray-500">Belum ada data zona.</p>}
        </div>

        {/* Student List */}
        <div className="p-4 border-t">
          <h3 className="font-bold mb-3">Siswa</h3>
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-semibold">{student.name}</div>
                <div
                  className={`text-xs ${
                    student.inGeofence ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {student.inGeofence ? '✅ Dalam Zona' : '⚠️ Luar Zona'}
                </div>
                <div className="text-xs text-gray-500">
                  {Number(student.distance || 0).toFixed(0)}m
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <p className="text-sm text-gray-500">Belum ada data siswa.</p>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
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
              color="green"
              fillColor="lightgreen"
              fillOpacity={0.2}
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
                  Status: {student.inGeofence ? '✅ Dalam Zona' : '⚠️ Luar Zona'}
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
