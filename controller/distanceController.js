const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');
const calculateDistance = require('../config/distance');

exports.getDistance = catchAsyncErrors(async (req, res, next) => {
    const { origin_lat, origin_lng, destination_lat, destination_lng } = req.query;

    // Validate coordinates
    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
        return next(new ErrorHandler('All coordinates are required', 400));
    }

    // Convert coordinates to numbers
    const lat1 = parseFloat(origin_lat);
    const lon1 = parseFloat(origin_lng);
    const lat2 = parseFloat(destination_lat);
    const lon2 = parseFloat(destination_lng);

    // Validate coordinate ranges
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        return next(new ErrorHandler('Invalid coordinates', 400));
    }

    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
        return next(new ErrorHandler('Latitude must be between -90 and 90', 400));
    }

    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        return next(new ErrorHandler('Longitude must be between -180 and 180', 400));
    }

    // Calculate distance and duration
    const result = calculateDistance(lat1, lon1, lat2, lon2);

    res.status(200).json(result);
}); 