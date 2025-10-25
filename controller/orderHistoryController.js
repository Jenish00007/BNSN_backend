const Order = require('../model/order');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');

// Get user's order history with filtering and pagination
exports.getOrderHistory = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // Optional status filter
    const startDate = req.query.startDate; // Optional date range filter
    const endDate = req.query.endDate;

    // Build query
    const query = { 'user._id': userId };
    
    if (status) {
        query.status = status;
    }

    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get orders with pagination
    const orders = await Order.find(query)
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .populate('cart.product', 'name images price');

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);

    // Format orders to include userLocation
    const formattedOrders = orders.map(order => ({
        _id: order._id,
        status: order.status,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        itemsQty: order.cart.reduce((total, item) => total + item.quantity, 0),
        items: order.cart.map((item) => ({
            _id: item._id,
            name: item.product?.name || "Product not found",
            quantity: item.quantity,
            price: item.price,
            image: item.product?.images?.[0]?.url || "",
        })),
        shippingAddress: order.shippingAddress,
        paymentInfo: order.paymentInfo,
        userLocation: order.userLocation || null,
        deliveredAt: order.deliveredAt,
        paidAt: order.paidAt,
        otp: order.otp || null,
        delivery_instruction: order.delivery_instruction || '',
        deliveryMan: order.deliveryMan || null
    }));

    res.status(200).json({
        success: true,
        orders: formattedOrders,
        pagination: {
            currentPage: page,
            totalPages,
            totalOrders,
            ordersPerPage: limit
        }
    });
});

// Get order details by ID
exports.getOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
        _id: orderId,
        'user._id': userId
    }).populate('cart.product', 'name images price description');

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    // Format order to include userLocation
    const formattedOrder = {
        _id: order._id,
        status: order.status,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        itemsQty: order.cart.reduce((total, item) => total + item.quantity, 0),
        items: order.cart.map((item) => ({
            _id: item._id,
            name: item.product?.name || "Product not found",
            quantity: item.quantity,
            price: item.price,
            image: item.product?.images?.[0]?.url || "",
        })),
        shippingAddress: order.shippingAddress,
        paymentInfo: order.paymentInfo,
        userLocation: order.userLocation || null,
        deliveredAt: order.deliveredAt,
        paidAt: order.paidAt,
        otp: order.otp || null,
        delivery_instruction: order.delivery_instruction || '',
        deliveryMan: order.deliveryMan || null
    };

    res.status(200).json({
        success: true,
        order: formattedOrder
    });
});

// Get order statistics
exports.getOrderStats = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // Get total orders
    const totalOrders = await Order.countDocuments({ 'user._id': userId });

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
        { $match: { 'user._id': userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get total spent
    const totalSpent = await Order.aggregate([
        { $match: { 'user._id': userId } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Get recent orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentOrders = await Order.countDocuments({
        'user._id': userId,
        createdAt: { $gte: sixMonthsAgo }
    });

    res.status(200).json({
        success: true,
        stats: {
            totalOrders,
            ordersByStatus: ordersByStatus.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            totalSpent: totalSpent[0]?.total || 0,
            recentOrders
        }
    });
}); 