const dotenv = require('dotenv');
dotenv.config();

const razorpayConfig = {
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
    frontend_url: process.env.FRONTEND_URL,
    currency: "INR",
    // Minimum amount in paise (₹1 = 100 paise)
    min_amount: 100,
    // Maximum amount in paise (₹100,000 = 10,000,000 paise)
    max_amount: 10000000,
    // Payment link expiry in seconds (24 hours)
    payment_link_expiry: 86400,
    // Callback URL for payment success
    callback_url: `${process.env.FRONTEND_URL}/payment-success`,
    // Callback method
    callback_method: "get"
};

// Validate required environment variables
const validateConfig = () => {
    const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'FRONTEND_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate Razorpay key format
    if (!razorpayConfig.key_id.startsWith('rzp_')) {
        throw new Error('Invalid Razorpay key format. Key should start with "rzp_"');
    }
};

// Initialize configuration
try {
    validateConfig();
    console.log('Razorpay configuration validated successfully');
} catch (error) {
    console.error('Razorpay configuration error:', error.message);
    process.exit(1);
}

module.exports = razorpayConfig; 