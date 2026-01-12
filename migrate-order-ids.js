const mongoose = require("mongoose");
const Order = require("./model/order");
require("dotenv").config();

const migrateOrderIds = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find all orders without orderId
    const ordersWithoutOrderId = await Order.find({ orderId: { $exists: false } });
    console.log(`Found ${ordersWithoutOrderId.length} orders without orderId`);

    // Get the highest existing orderId
    const lastOrder = await Order.findOne({}, {}, { sort: { orderId: -1 } });
    let nextOrderId = lastOrder && lastOrder.orderId ? lastOrder.orderId + 1 : 1;

    console.log(`Starting orderId assignment from: ${nextOrderId}`);

    // Update orders in batches
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < ordersWithoutOrderId.length; i += batchSize) {
      const batch = ordersWithoutOrderId.slice(i, i + batchSize);
      
      const updatePromises = batch.map(async (order) => {
        try {
          order.orderId = nextOrderId++;
          await order.save();
          updatedCount++;
          console.log(`Updated order ${order._id} with orderId: ${order.orderId}`);
        } catch (error) {
          console.error(`Error updating order ${order._id}:`, error);
        }
      });

      await Promise.all(updatePromises);
      console.log(`Batch ${Math.floor(i / batchSize) + 1} completed. Total updated: ${updatedCount}`);
    }

    console.log(`Migration completed! Updated ${updatedCount} orders with orderIds.`);
    
    // Verify the migration
    const totalOrders = await Order.countDocuments();
    const ordersWithOrderId = await Order.countDocuments({ orderId: { $exists: true } });
    
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Orders with orderId: ${ordersWithOrderId}`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the migration
migrateOrderIds();
