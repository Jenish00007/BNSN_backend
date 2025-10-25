const DeliveryMan = require("../model/deliveryman");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const Order = require("../model/order");
const jwt = require("jsonwebtoken");
const calculateDistance = require("../config/distance");

// Helper function to calculate distance between deliveryman and order user
const getDistanceFromDeliveryManToUser = async (deliveryManId, userLocation) => {
    try {
        // Get deliveryman's current location
        const deliveryMan = await DeliveryMan.findById(deliveryManId);
        
        if (!deliveryMan || !deliveryMan.currentLocation || !deliveryMan.currentLocation.coordinates) {
            return null; // No location data available
        }
        
        // Check if user location is available
        if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
            return null; // No user location data available
        }
        
        // Extract coordinates
        const [deliveryManLon, deliveryManLat] = deliveryMan.currentLocation.coordinates;
        const userLat = userLocation.latitude;
        const userLon = userLocation.longitude;
        
        // Calculate distance using the existing function
        const distanceResult = calculateDistance(deliveryManLat, deliveryManLon, userLat, userLon);
        
        return {
            distanceKm: parseFloat((distanceResult.distanceMeters / 1000).toFixed(2)),
            distanceMeters: distanceResult.distanceMeters,
            duration: distanceResult.localizedValues.duration.text
        };
    } catch (error) {
        console.error('Error calculating distance:', error);
        return null;
    }
};

// Export the distance calculation function for use in other controllers
exports.calculateDistanceToUser = getDistanceFromDeliveryManToUser;

// Register delivery man
exports.registerDeliveryMan = async (req, res) => {
    try {
        console.log("Starting delivery man registration...");
        const { 
            name, 
            email, 
            password, 
            phoneNumber, 
            address, 
            vehicleType, 
            vehicleNumber, 
            licenseNumber 
        } = req.body;

        console.log("Registration data received:", { 
            name, 
            email, 
            phoneNumber, 
            address, 
            vehicleType, 
            vehicleNumber, 
            licenseNumber 
        });

        // Validate required fields
        if (!name || !email || !password || !phoneNumber || !address || !vehicleType || !vehicleNumber || !licenseNumber) {
            console.log("Missing required fields");
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Check if delivery man already exists
        const existingDeliveryMan = await DeliveryMan.findOne({ email });
        if (existingDeliveryMan) {
            console.log("Email already registered:", email);
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Get the file URL from the uploaded file
        let idProofUrl = "";
        if (req.file) {
            idProofUrl = req.file.location || req.file.path;
            console.log("ID proof uploaded:", idProofUrl);
            
            if (!idProofUrl) {
                return res.status(400).json({
                    success: false,
                    message: "Failed to upload ID proof"
                });
            }
        } else {
            console.log("No ID proof file provided");
            return res.status(400).json({
                success: false,
                message: "ID proof is required"
            });
        }

        // Create new delivery man
        const deliveryMan = await DeliveryMan.create({
            name,
            email,
            password,
            phoneNumber,
            address,
            vehicleType,
            vehicleNumber,
            licenseNumber,
            idProof: idProofUrl,
            isApproved: false // Default to false, needs admin approval
        });

        console.log("Delivery man created successfully:", deliveryMan._id);

        // Remove password from response
        deliveryMan.password = undefined;

        res.status(201).json({
            success: true,
            message: "Registration successful! Waiting for admin approval.",
            deliveryMan
        });

    } catch (error) {
        console.error("Error in registerDeliveryMan:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Login delivery man
exports.loginDeliveryMan = async (req, res) => {
    try {
        console.log("Starting delivery man login...");
        const { email, password } = req.body;

        if (!email || !password) {
            console.log("Missing email or password");
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // Find delivery man
        const deliveryMan = await DeliveryMan.findOne({ email }).select("+password");
        console.log("Delivery man found:", deliveryMan ? "Yes" : "No");

        if (!deliveryMan) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if delivery man is approved
        if (!deliveryMan.isApproved) {
            return res.status(401).json({
                success: false,
                message: "Your account is pending approval"
            });
        }

        // Check password
        const isPasswordMatched = await deliveryMan.comparePassword(password);
        console.log("Password matched:", isPasswordMatched ? "Yes" : "No");

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: deliveryMan._id },
            process.env.JWT_SECRET_KEY
        );
        console.log("Token generated successfully");

        // Remove password from response
        deliveryMan.password = undefined;

        // Set cookie
        const options = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.status(200)
            .cookie("token", token, options)
            .json({
                success: true,
                message: "Login successful",
                token,
                deliveryMan
            });

    } catch (error) {
        console.error("Error in loginDeliveryMan:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all delivery men (Admin)
exports.getAllDeliveryMen = catchAsyncErrors(async (req, res, next) => {
    const deliveryMen = await DeliveryMan.find();
    res.status(200).json({
        success: true,
        deliveryMen,
    });
});

// Approve delivery man (Admin)
exports.approveDeliveryMan = catchAsyncErrors(async (req, res, next) => {
    const deliveryMan = await DeliveryMan.findById(req.params.id);

    if (!deliveryMan) {
        return next(new ErrorHandler("Delivery man not found", 404));
    }

    deliveryMan.isApproved = true;
    await deliveryMan.save();

    res.status(200).json({
        success: true,
        message: "Delivery man approved successfully",
    });
});

// Reject delivery man (Admin)
exports.rejectDeliveryMan = catchAsyncErrors(async (req, res, next) => {
    const deliveryMan = await DeliveryMan.findById(req.params.id);

    if (!deliveryMan) {
        return next(new ErrorHandler("Delivery man not found", 404));
    }

    await deliveryMan.remove();

    res.status(200).json({
        success: true,
        message: "Delivery man rejected and removed successfully",
    });
});

// Get delivery man details
exports.getDeliveryManDetails = catchAsyncErrors(async (req, res, next) => {
    const deliveryMan = await DeliveryMan.findById(req.deliveryMan.id);

    res.status(200).json({
        success: true,
        deliveryMan,
    });
});

// Update delivery man profile
exports.updateDeliveryManProfile = catchAsyncErrors(async (req, res, next) => {
    const newDeliveryManData = {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
    };

    const deliveryMan = await DeliveryMan.findByIdAndUpdate(
        req.deliveryMan.id,
        newDeliveryManData,
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    );

    res.status(200).json({
        success: true,
        deliveryMan,
    });
});

// Update delivery man password
exports.updateDeliveryManPassword = catchAsyncErrors(async (req, res, next) => {
    const deliveryMan = await DeliveryMan.findById(req.deliveryMan.id).select("+password");

    // Check previous password
    const isMatched = await deliveryMan.comparePassword(req.body.oldPassword);
    if (!isMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    deliveryMan.password = req.body.newPassword;
    await deliveryMan.save();

    sendToken(deliveryMan, 200, res);
});

// Logout delivery man
exports.logoutDeliveryMan = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

// Edit delivery man (Admin)
exports.editDeliveryMan = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, email, phoneNumber, address, vehicleType, vehicleNumber, licenseNumber, isApproved } = req.body;
        const deliveryManId = req.params.id;

        const deliveryMan = await DeliveryMan.findById(deliveryManId);

        if (!deliveryMan) {
            return next(new ErrorHandler("Delivery man not found", 404));
        }

        // Update fields if provided
        if (name) deliveryMan.name = name;
        if (email) {
            // Check if email is already taken by another delivery man
            const existingDeliveryMan = await DeliveryMan.findOne({ email, _id: { $ne: deliveryManId } });
            if (existingDeliveryMan) {
                return next(new ErrorHandler("Email already registered", 400));
            }
            deliveryMan.email = email;
        }
        if (phoneNumber) deliveryMan.phoneNumber = phoneNumber;
        if (address) deliveryMan.address = address;
        if (vehicleType) deliveryMan.vehicleType = vehicleType;
        if (vehicleNumber) deliveryMan.vehicleNumber = vehicleNumber;
        if (licenseNumber) deliveryMan.licenseNumber = licenseNumber;
        if (isApproved !== undefined) deliveryMan.isApproved = isApproved;

        // Update ID proof if new file is uploaded
        if (req.file) {
            const idProofUrl = req.file.location || req.file.key;
            if (!idProofUrl) {
                return next(new ErrorHandler("Failed to upload ID proof", 400));
            }
            deliveryMan.idProof = idProofUrl;
        }

        await deliveryMan.save();

        res.status(200).json({
            success: true,
            message: "Delivery man updated successfully",
            deliveryMan
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Delete delivery man (Admin)
exports.deleteDeliveryMan = catchAsyncErrors(async (req, res, next) => {
    try {
        const deliveryManId = req.params.id;

        const deliveryMan = await DeliveryMan.findById(deliveryManId);

        if (!deliveryMan) {
            return next(new ErrorHandler("Delivery man not found", 404));
        }

        await deliveryMan.deleteOne();

        res.status(200).json({
            success: true,
            message: "Delivery man deleted successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get delivery man orders
exports.getDeliveryManOrders = catchAsyncErrors(async (req, res, next) => {
    if (!req.deliveryMan || !req.deliveryMan._id) {
        return next(new ErrorHandler("Delivery man not authenticated", 401));
    }

    // Get orders - exclude orders that have been ignored by this deliveryman
    const orders = await Order.find({
        $and: [
            {
                $or: [
                    { status: 'Processing' },
                    { status: 'Out for delivery' },
                    { deliveryMan: req.deliveryMan._id }
                ]
            },
            {
                $or: [
                    { ignored_by: { $exists: false } },
                    { ignored_by: { $nin: [req.deliveryMan._id] } }
                ]
            }
        ]
    })
    .populate('shop', 'name address')
    .populate('user', 'name phone')
    .populate('deliveryMan', 'name phone')
    .sort({ createdAt: -1 });

    // Format orders for response with distance calculation
    const formattedOrders = await Promise.all(orders.map(async (order) => {
        // Calculate distance from deliveryman to order user
        let distanceInfo = null;
        if (order.userLocation) {
            distanceInfo = await getDistanceFromDeliveryManToUser(req.deliveryMan._id, order.userLocation);
        }

        return {
            _id: order._id,
            shop: order.shop ? {
                _id: order.shop._id,
                name: order.shop.name,
                address: order.shop.address
            } : null,
            user: order.user ? {
                _id: order.user._id,
                name: order.user.name,
                phone: order.user.phone
            } : null,
            deliveryMan: order.deliveryMan ? {
                _id: order.deliveryMan._id,
                name: order.deliveryMan.name,
                phone: order.deliveryMan.phone
            } : null,
            cart: order.cart || [],
            totalPrice: order.totalPrice,
            status: order.status,
            distance: distanceInfo ? {
                km: distanceInfo.distanceKm,
                meters: distanceInfo.distanceMeters,
                estimatedTime: distanceInfo.duration
            } : null,
            paymentInfo: order.paymentInfo || {},
            shippingAddress: order.shippingAddress,
            userLocation: order.userLocation || null,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            paidAt: order.paidAt
        };
    }));

    return res.status(200).json({
        success: true,
        orders: formattedOrders
    });
});

// Accept order
exports.acceptOrder = catchAsyncErrors(async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const deliveryManId = req.deliveryMan.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return next(new ErrorHandler("Order not found", 404));
        }

        // Check if order is already assigned
        if (order.delivery_man) {
            return next(new ErrorHandler("Order is already assigned to another delivery man", 400));
        }

        // Update order with delivery man
        order.delivery_man = deliveryManId;
        order.status = "Out for delivery";
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order accepted successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Ignore order
exports.ignoreOrder = catchAsyncErrors(async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const deliveryManId = req.deliveryMan.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return next(new ErrorHandler("Order not found", 404));
        }

        // Check if order is already assigned to this delivery man
        if (order.delivery_man && order.delivery_man.toString() === deliveryManId) {
            return next(new ErrorHandler("Cannot ignore an order that is already assigned to you", 400));
        }

        res.status(200).json({
            success: true,
            message: "Order ignored successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Verify delivery man token
exports.verifyToken = async (req, res) => {
    try {
        console.log("Verifying token...");
        
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log("Auth header received:", authHeader ? "Yes" : "No");
        
        if (!authHeader) {
            console.log("No authorization header");
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        // Remove 'Bearer ' prefix if present
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        console.log("Token extracted:", token.substring(0, 10) + "...");

        if (!token) {
            console.log("Empty token after extraction");
            return res.status(401).json({
                success: false,
                message: "Invalid token format"
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            console.log("Token decoded successfully, payload:", decoded);
        } catch (error) {
            console.error("Token verification failed:", error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token expired"
                });
            }
            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            });
        }

        if (!decoded || !decoded.id) {
            console.log("Invalid token payload:", decoded);
            return res.status(401).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        // Get delivery man
        const deliveryMan = await DeliveryMan.findById(decoded.id);
        if (!deliveryMan) {
            console.log("Delivery man not found for ID:", decoded.id);
            return res.status(404).json({
                success: false,
                message: "Delivery man not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Token is valid",
            deliveryMan: {
                _id: deliveryMan._id,
                name: deliveryMan.name,
                email: deliveryMan.email,
                phone: deliveryMan.phone,
                isApproved: deliveryMan.isApproved
            }
        });

    } catch (error) {
        console.error("Error in verifyToken:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get single delivery man details for preview (Admin)
exports.getDeliveryManPreview = catchAsyncErrors(async (req, res, next) => {
    const deliveryMan = await DeliveryMan.findById(req.params.id);

    if (!deliveryMan) {
        return next(new ErrorHandler("Delivery man not found", 404));
    }

    res.status(200).json({
        success: true,
        deliveryMan,
    });
}); 

// Update Expo push notification token for delivery man
exports.updateExpoPushToken = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        return next(new ErrorHandler('Expo push token is required', 400));
    }
    
    const deliveryMan = await DeliveryMan.findById(req.deliveryMan._id);
    if (!deliveryMan) {
        return next(new ErrorHandler('Delivery man not found', 404));
    }
    
    deliveryMan.expoPushToken = token;
    await deliveryMan.save();
    
    res.status(200).json({ 
        success: true, 
        message: 'Expo push token updated', 
        token 
    });
}); 