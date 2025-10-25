const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // Distance in meters

    // Calculate duration (assuming average speed of 50 km/h)
    const speedKmh = 50;
    const durationSeconds = (distance / 1000) / speedKmh * 3600;

    // Format duration
    const days = Math.floor(durationSeconds / (24 * 3600));
    const hours = Math.floor((durationSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);

    // Format distance
    const distanceKm = (distance / 1000).toFixed(2);
    const formattedDistance = `${parseFloat(distanceKm).toLocaleString()} km`;

    // Format duration text
    let durationText = '';
    if (days > 0) durationText += `${days} days `;
    if (hours > 0) durationText += `${hours} hours `;
    if (minutes > 0 && days === 0) durationText += `${minutes} minutes`;

    return {
        distanceMeters: Math.round(distance),
        duration: `${Math.round(durationSeconds)}s`,
        localizedValues: {
            distance: {
                text: formattedDistance
            },
            duration: {
                text: durationText.trim()
            },
            staticDuration: {
                text: durationText.trim()
            }
        }
    };
};

module.exports = calculateDistance; 