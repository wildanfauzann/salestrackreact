// Haversine formula to calculate distance between two coordinates in meters
export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
export function checkGeofence(userLat, userLon, officeLat, officeLon, radiusMeters) {
    const distance = haversineDistance(userLat, userLon, officeLat, officeLon);
    return {
        isOutside: distance > radiusMeters,
        distanceMeters: distance,
    };
}
