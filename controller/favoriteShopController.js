const FavoriteShop = require('../model/favoriteShop');
const Shop = require('../model/shop');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');

// Add shop to favorites
exports.addToFavoriteShops = catchAsyncErrors(async (req, res, next) => {
    const { shopId } = req.body;
    const userId = req.user._id;

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
        return next(new ErrorHandler('Shop not found', 404));
    }

    // Check if already in favorites
    const existingFavorite = await FavoriteShop.findOne({ user: userId, shop: shopId });
    if (existingFavorite) {
        return next(new ErrorHandler('Shop already in favorites', 400));
    }

    const favoriteShop = await FavoriteShop.create({
        user: userId,
        shop: shopId
    });

    res.status(201).json({
        success: true,
        favoriteShop
    });
});

// Remove shop from favorites
exports.removeFromFavoriteShops = catchAsyncErrors(async (req, res, next) => {
    const { shopId } = req.params;
    const userId = req.user._id;

    const favoriteShop = await FavoriteShop.findOneAndDelete({ user: userId, shop: shopId });
    
    if (!favoriteShop) {
        return next(new ErrorHandler('Favorite shop not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Shop removed from favorites'
    });
});

// Get user's favorite shops with pagination
exports.getFavoriteShops = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get favorite shops with pagination
    const favoriteShops = await FavoriteShop.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: 'shop',
            select: 'name avatar address phone ratings withdrawMethod availableBalance transections'
        });

    // Get total count for pagination
    const totalShops = await FavoriteShop.countDocuments({ user: userId });

    // Calculate total pages
    const totalPages = Math.ceil(totalShops / limit);

    // Check app type to conditionally hide withdraw-related fields
    const Configuration = require('../model/Configuration');
    const configuration = await Configuration.findOne({ isActive: true });
    
    let processedFavoriteShops = favoriteShops.map(favoriteShop => {
        let shopData = favoriteShop.toObject();
        
        // If app type is single vendor, hide withdraw-related fields
        if (configuration && configuration.appType === 'singlevendor' && shopData.shop) {
            delete shopData.shop.withdrawMethod;
            delete shopData.shop.availableBalance;
            delete shopData.shop.transections;
        }
        
        return shopData;
    });

    res.status(200).json({
        success: true,
        favoriteShops: processedFavoriteShops,
        pagination: {
            currentPage: page,
            totalPages,
            totalShops,
            shopsPerPage: limit
        }
    });
});

// Check if shop is in favorites
exports.checkFavoriteShop = catchAsyncErrors(async (req, res, next) => {
    const { shopId } = req.params;
    const userId = req.user._id;

    const favoriteShop = await FavoriteShop.findOne({ user: userId, shop: shopId });

    res.status(200).json({
        success: true,
        isFavorite: !!favoriteShop
    });
}); 