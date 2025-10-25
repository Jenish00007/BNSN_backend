const mongoose = require('mongoose');
const ShopBanner = require('../model/shopBanner');

// MongoDB connection string
const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

// Sample banner data with actual image URLs
const dummyBanners = [
    {
        shopId: "683489288c3e232ac5eef736",
        title: "Summer Sale",
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=60",
        link: "/products?category=summer",
        isActive: true
    },
    {
        shopId: "683489288c3e232ac5eef736",
        title: "New Arrivals",
        image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&auto=format&fit=crop&q=60",
        link: "/products?category=new",
        isActive: true
    },
    {
        shopId: "683489288c3e232ac5eef736",
        title: "Special Offers",
        image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&auto=format&fit=crop&q=60",
        link: "/products?category=offers",
        isActive: true
    },
    {
        shopId: "683489288c3e232ac5eef736",
        title: "Featured Products",
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=60",
        link: "/products?category=featured",
        isActive: true
    },
    {
        shopId: "683489288c3e232ac5eef736",
        title: "Holiday Collection",
        image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&auto=format&fit=crop&q=60",
        link: "/products?category=holiday",
        isActive: true
    }
];

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    return ShopBanner.insertMany(dummyBanners);
})
.then(() => {
    console.log('Dummy banners added successfully');
    process.exit(0);
})
.catch((error) => {
    console.error('Error:', error);
    process.exit(1);
}); 