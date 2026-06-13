/**
 * Calculate distance between coordinates using Haversine formula (meters)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if student is in any zone
 */
export function checkGeofence(studentLat, studentLon, zones) {
  for (const zone of zones) {
    const distance = calculateDistance(studentLat, studentLon, zone.latitude, zone.longitude);
    if (distance <= (zone.radius || 100)) {
      return { inGeofence: true, zoneId: zone.id, distance };
    }
  }
  return { inGeofence: false, zoneId: null, distance: null };
}
