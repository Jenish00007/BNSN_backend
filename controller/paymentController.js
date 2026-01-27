const Payment = require("../model/payment");
const UserPost = require("../model/userPost");
const { getCategoryForm } = require("../configs/categoryForms");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create payment intent for post
exports.createPaymentIntent = catchAsyncErrors(async (req, res, next) => {
    try {
        const { categoryName, paymentMethod } = req.body;
        const userId = req.user._id;

        if (!categoryName || !paymentMethod) {
            return next(new ErrorHandler("Category name and payment method are required", 400));
        }

        // Get category configuration
        const categoryConfig = getCategoryForm(categoryName);
        if (!categoryConfig) {
            return next(new ErrorHandler("Invalid category", 400));
        }

        // Check if user can post for free
        const userPost = await UserPost.findOrCreate(userId);
        const canPostFree = userPost.canPostForFree(categoryName);
        
        if (canPostFree) {
            return res.status(200).json({
                success: true,
                message: "You can post for free in this category",
                cost: 0,
                requiresPayment: false
            });
        }

        const cost = categoryConfig.price;

        if (cost === 0) {
            return res.status(200).json({
                success: true,
                message: "Free posting available",
                cost: 0,
                requiresPayment: false
            });
        }

        // Create payment record
        const payment = new Payment({
            user: userId,
            category: categoryName,
            amount: cost,
            paymentMethod: paymentMethod,
            status: 'pending'
        });

        await payment.save();

        // Here you would integrate with actual payment gateway (Razorpay, PhonePe, etc.)
        // For now, returning mock payment data
        const paymentData = {
            paymentId: payment._id,
            amount: cost,
            currency: 'INR',
            // Mock gateway data - replace with actual gateway integration
            orderId: `order_${Date.now()}`,
            gateway: 'razorpay' // or based on paymentMethod
        };

        res.status(200).json({
            success: true,
            message: "Payment initiated",
            cost: cost,
            requiresPayment: true,
            paymentData
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Verify payment completion
exports.verifyPayment = catchAsyncErrors(async (req, res, next) => {
    try {
        const { paymentId, transactionId, gatewayResponse } = req.body;
        const userId = req.user._id;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return next(new ErrorHandler("Payment not found", 404));
        }

        if (payment.user.toString() !== userId) {
            return next(new ErrorHandler("Unauthorized", 401));
        }

        if (payment.status !== 'pending') {
            return next(new ErrorHandler("Payment already processed", 400));
        }

        // Here you would verify with actual payment gateway
        // For now, marking as completed
        await payment.markCompleted(transactionId, gatewayResponse);

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            payment: {
                id: payment._id,
                status: payment.status,
                amount: payment.amount,
                transactionId: payment.transactionId
            }
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get user's post history and payment status
exports.getUserPostHistory = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        const userPost = await UserPost.findOrCreate(userId);
        const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });

        // Format category posts data
        const categoryPosts = {};
        for (const [key, value] of userPost.categoryPosts.entries()) {
            const categoryConfig = getCategoryForm(key);
            categoryPosts[key] = {
                categoryName: categoryConfig ? categoryConfig.name : key,
                totalPosts: value.totalPosts,
                freePostsUsed: value.freePostsUsed,
                paidPosts: value.paidPosts,
                freePostsLimit: categoryConfig ? categoryConfig.freePosts : 0,
                postCost: categoryConfig ? categoryConfig.price : 0,
                canPostForFree: userPost.canPostForFree(categoryConfig ? categoryConfig.name : key),
                lastPostedAt: value.lastPostedAt
            };
        }

        res.status(200).json({
            success: true,
            data: {
                totalFreePostsUsed: userPost.totalFreePostsUsed,
                totalPaidPosts: userPost.totalPaidPosts,
                totalAmountPaid: userPost.totalAmountPaid,
                categoryPosts,
                recentPayments: payments.map(payment => ({
                    id: payment._id,
                    category: payment.category,
                    amount: payment.amount,
                    status: payment.status,
                    createdAt: payment.createdAt,
                    completedAt: payment.completedAt
                }))
            }
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get post cost for a category
exports.getPostCost = catchAsyncErrors(async (req, res, next) => {
    try {
        const { categoryName } = req.params;
        const userId = req.user._id;

        const categoryConfig = getCategoryForm(categoryName);
        if (!categoryConfig) {
            return next(new ErrorHandler("Invalid category", 400));
        }

        const userPost = await UserPost.findOrCreate(userId);
        const canPostFree = userPost.canPostForFree(categoryName);
        const cost = canPostFree ? 0 : categoryConfig.price;

        res.status(200).json({
            success: true,
            data: {
                categoryName,
                baseCost: categoryConfig.price,
                freePostsLimit: categoryConfig.freePosts,
                freePostsUsed: userPost.categoryPosts.get(Object.keys(categoryConfig).find(key => 
                    categoryConfig[key].name.toLowerCase() === categoryName.toLowerCase()
                ))?.freePostsUsed || 0,
                canPostForFree: canPostFree,
                finalCost: cost
            }
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});
