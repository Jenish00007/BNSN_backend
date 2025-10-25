const Favorite = require('../model/favorite');
const Product = require('../model/product');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');

// Add product to favorites
exports.addToFavorites = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user._id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({ user: userId, product: productId });
    if (existingFavorite) {
        return next(new ErrorHandler('Product already in favorites', 400));
    }

    const favorite = await Favorite.create({
        user: userId,
        product: productId
    });

    res.status(201).json({
        success: true,
        favorite
    });
});

// Remove product from favorites
exports.removeFromFavorites = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user._id;

    const favorite = await Favorite.findOneAndDelete({ user: userId, product: productId });
    
    if (!favorite) {
        return next(new ErrorHandler('Favorite not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Product removed from favorites'
    });
});

// Get user's favorites
exports.getFavorites = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    const favorites = await Favorite.find({ user: userId })
        .populate({
            path: 'product',
            select: 'name price originalPrice discountPrice images description stock'
        });

    res.status(200).json({
        success: true,
        favorites
    });
}); 