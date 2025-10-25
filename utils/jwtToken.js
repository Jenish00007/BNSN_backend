// Create token and send response
const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  // Remove sensitive data before sending
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    address: user.address,
    vehicleType: user.vehicleType,
    vehicleNumber: user.vehicleNumber,
    licenseNumber: user.licenseNumber,
    idProof: user.idProof,
    isApproved: user.isApproved,
    isAvailable: user.isAvailable,
    currentLocation: user.currentLocation,
    rating: user.rating,
    totalDeliveries: user.totalDeliveries,
    createdAt: user.createdAt
  };

  res.status(statusCode).json({
    success: true,
    deliveryman: userData,
    token,
  });
};

module.exports = sendToken;
