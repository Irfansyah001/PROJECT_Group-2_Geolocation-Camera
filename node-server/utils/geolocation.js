/**
 * GeoProof - Geolocation Utilities
 * 
 * This module contains utility functions for geolocation calculations
 * including the Haversine formula for calculating distances between coordinates.
 */

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lng1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lng2 - Longitude of the second point in degrees
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  
  // Convert degrees to radians
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

/**
 * Check if a point is inside a circular geofence.
 * 
 * @param {number} pointLat - Latitude of the point to check
 * @param {number} pointLng - Longitude of the point to check
 * @param {number} centerLat - Latitude of the geofence center
 * @param {number} centerLng - Longitude of the geofence center
 * @param {number} radiusM - Radius of the geofence in meters
 * @returns {Object} Result containing distance and whether point is inside
 */
function checkInsideGeofence(pointLat, pointLng, centerLat, centerLng, radiusM) {
  const distance = haversineDistance(pointLat, pointLng, centerLat, centerLng);
  const isInside = distance <= radiusM;
  
  return {
    distanceM: Math.round(distance * 100) / 100, // Round to 2 decimal places
    isInside,
    radiusM,
    marginM: Math.round((radiusM - distance) * 100) / 100 // Positive if inside, negative if outside
  };
}

/**
 * Validate coordinates are within valid ranges.
 * 
 * @param {number} lat - Latitude to validate
 * @param {number} lng - Longitude to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateCoordinates(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { isValid: false, error: 'Koordinat tidak boleh kosong' };
  }
  
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return { isValid: false, error: 'Koordinat harus berupa angka' };
  }
  
  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Latitude harus antara -90 dan 90' };
  }
  
  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Longitude harus antara -180 dan 180' };
  }
  
  return { isValid: true, latitude, longitude };
}

/**
 * Calculate speed between two attendance records (for anomaly detection).
 * 
 * @param {Object} record1 - First attendance record with lat, lng, and timestamp
 * @param {Object} record2 - Second attendance record with lat, lng, and timestamp
 * @returns {Object} Speed calculation result
 */
function calculateSpeed(record1, record2) {
  if (!record1 || !record2) {
    return { speedKmh: 0, isAnomalous: false };
  }
  
  const distance = haversineDistance(
    record1.latitude, record1.longitude,
    record2.latitude, record2.longitude
  );
  
  const time1 = new Date(record1.timestamp || record1.checkIn);
  const time2 = new Date(record2.timestamp || record2.checkIn);
  const timeDiffHours = Math.abs(time2 - time1) / (1000 * 60 * 60);
  
  if (timeDiffHours === 0) {
    return { speedKmh: 0, isAnomalous: false, reason: 'Same timestamp' };
  }
  
  const speedKmh = (distance / 1000) / timeDiffHours;
  
  // Flag as anomalous if speed exceeds 200 km/h (very unlikely for a student)
  const isAnomalous = speedKmh > 200;
  
  return {
    distanceM: Math.round(distance),
    timeDiffMinutes: Math.round(timeDiffHours * 60),
    speedKmh: Math.round(speedKmh * 10) / 10,
    isAnomalous,
    reason: isAnomalous ? `Kecepatan tidak wajar: ${Math.round(speedKmh)} km/jam` : null
  };
}

module.exports = {
  haversineDistance,
  checkInsideGeofence,
  validateCoordinates,
  calculateSpeed
};
