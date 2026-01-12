const mongoose = require("mongoose");
const Order = require("./model/order");
require("dotenv").config();

const migrateOrdersCorrectDatabase = async () => {
  try {
    // Connect to the correct MongoDB (the one the server is using)
    const MONGODB_URI = "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to correct MongoDB database");

    // Find all orders without orderId
    const ordersWithoutOrderId = await Order.find({ orderId: { $exists: false } });
    console.log(`Found ${ordersWithoutOrderId.length} orders without orderId`);

    // Get the highest existing orderId
    const lastOrder = await Order.findOne({}, {}, { sort: { orderId: -1 } });
    let nextOrderId = lastOrder && lastOrder.orderId ? lastOrder.orderId + 1 : 1;

    console.log(`Starting orderId assignment from: ${nextOrderId}`);

    // Update orders
    for (const order of ordersWithoutOrderId) {
      try {
        order.orderId = nextOrderId++;
        await order.save();
        console.log(`Updated order ${order._id} with orderId: ${order.orderId}`);
      } catch (error) {
        console.error(`Error updating order ${order._id}:`, error);
      }
    }

    // Verify the migration
    const totalOrders = await Order.countDocuments();
    const ordersWithOrderId = await Order.countDocuments({ orderId: { $exists: true } });
    const ordersWithoutOrderIdAfter = await Order.countDocuments({ orderId: { $exists: false } });
    
    console.log(`\nMigration completed!`);
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Orders with orderId: ${ordersWithOrderId}`);
    console.log(`Orders without orderId: ${ordersWithoutOrderIdAfter}`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

migrateOrdersCorrectDatabase();
