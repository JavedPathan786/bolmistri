// Rough speed of a worker on a bike in the city (km per hour)
export const SPEED_KMH = 20

// Straight-line distance in km between two points (Haversine formula)
export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Rough arrival time in minutes
export function arrivalMinutes(km) {
  return Math.max(1, Math.round((km / SPEED_KMH) * 60))
}
