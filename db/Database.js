const mongoose = require("mongoose");

const connectDatabase = () => {
  console.log("Connecting to MongoDB:", process.env.MONGODB_URI); // Debug log

  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`✅ MongoDB connected with server: ${data.connection.host}`);
    })
    .catch((err) => {
      console.error(`❌ Error connecting to MongoDB: ${err.message}`);
    });
};

module.exports = connectDatabase;
