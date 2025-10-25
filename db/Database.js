const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`mongod connected with server: ${data.connection.host}`);
    })
    .catch((err) => {
      console.log(`Error connecting to MongoDB: ${err.message}`);
    });
};

module.exports = connectDatabase;
