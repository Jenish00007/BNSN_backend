const mongoose = require('mongoose');
const Product = require('../model/product');
const Favorite = require('../model/favorite');
const Cart = require('../model/cart');
const Order = require('../model/order');
const Shop = require('../model/shop');

// Connect to MongoDB
mongoose.connect('mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userId = '68349faa87cd0bb608a5cff8';

// Create a dummy shop first
const createDummyShop = async () => {
    const shop = await Shop.create({
        name: "Dummy Shop",
        email: "dummy@shop.com",
        password: "dummy123",
        description: "A dummy shop for testing",
        address: "123 Test Street",
        phoneNumber: 1234567890,
        zipCode: 12345,
        avatar: "default-avatar.jpg",
        location: {
            type: 'Point',
            coordinates: [0, 0]
        }
    });
    return shop;
};

// Create dummy products
const createDummyProducts = async (shopId) => {
    const products = await Product.create([
        {
            name: "Test Product 1",
            description: "A test product",
            category: "Electronics",
            tags: "test, dummy",
            originalPrice: 100,
            discountPrice: 80,
            stock: 50,
            images: ["product1.jpg"],
            shopId: shopId,
            shop: { _id: shopId, name: "Dummy Shop" }
        },
        {
            name: "Test Product 2",
            description: "Another test product",
            category: "Clothing",
            tags: "test, dummy",
            originalPrice: 50,
            discountPrice: 40,
            stock: 30,
            images: ["product2.jpg"],
            shopId: shopId,
            shop: { _id: shopId, name: "Dummy Shop" }
        }
    ]);
    return products;
};

// Add products to favorites
const addToFavorites = async (products) => {
    for (const product of products) {
        await Favorite.create({
            user: userId,
            product: product._id
        });
    }
};

// Add products to cart
const addToCart = async (products) => {
    for (const product of products) {
        await Cart.create({
            user: userId,
            product: product._id,
            quantity: Math.floor(Math.random() * 3) + 1
        });
    }
};

// Create dummy orders
const createDummyOrders = async (products) => {
    const order = await Order.create({
        cart: products.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.discountPrice,
            quantity: Math.floor(Math.random() * 3) + 1,
            images: product.images,
            shopId: product.shopId
        })),
        shippingAddress: {
            country: "Test Country",
            city: "Test City",
            address1: "123 Test Street",
            address2: "Apt 4B",
            zipCode: 12345,
            addressType: "Home"
        },
        user: {
            _id: userId,
            name: "Test User",
            email: "test@example.com"
        },
        totalPrice: products.reduce((sum, product) => sum + product.discountPrice, 0),
        status: "Processing",
        paymentInfo: {
            id: "test_payment_id",
            status: "Succeeded",
            type: "Credit Card"
        }
    });
};

// Main function to run all operations
const insertDummyData = async () => {
    try {
        // Create shop
        const shop = await createDummyShop();
        console.log('Shop created:', shop._id);

        // Create products
        const products = await createDummyProducts(shop._id);
        console.log('Products created:', products.map(p => p._id));

        // Add to favorites
        await addToFavorites(products);
        console.log('Added products to favorites');

        // Add to cart
        await addToCart(products);
        console.log('Added products to cart');

        // Create orders
        await createDummyOrders(products);
        console.log('Created dummy orders');

        console.log('All dummy data inserted successfully!');
    } catch (error) {
        console.error('Error inserting dummy data:', error);
    } finally {
        mongoose.disconnect();
    }
};

// Run the script
insertDummyData(); 