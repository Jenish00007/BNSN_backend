const express = require("express");
const ErrorHandler = require("./middleware/error");
const connectDatabase = require("./db/Database");
const app = express();

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}
// connect db
connectDatabase();

// create server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

// middlewares
app.use(express.json());
app.use(cookieParser());
// Enable CORS for all routes

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Remove local uploads static route since we're using S3
// app.use("/", express.static("uploads"));

app.get("/test", (req, res) => {
  res.send("Hello World!");
});

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// why bodyparser?
// bodyparser is used to parse the data from the body of the request to the server (POST, PUT, DELETE, etc.)

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const message = require("./controller/message");
const conversation = require("./controller/conversation");
const withdraw = require("./controller/withdraw");
const deliveryman = require("./controller/deliveryman");
const notification = require("./controller/notification");

// New routes
const moduleRoutes = require("./routes/moduleRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const userProductRoutes = require("./routes/userProduct");
const searchRoutes = require("./routes/search");
const shopRoutes = require("./routes/shopRoutes");
const shopBannerRoutes = require("./routes/shopBannerRoutes");
const adminBannerRoutes = require("./routes/adminBannerRoutes");
const favoriteRoutes = require("./routes/favorite");
const cartRoutes = require("./routes/cart");
const itemRoutes = require("./routes/itemRoutes");
const orderHistoryRoutes = require("./routes/orderHistory");
const favoriteShopRoutes = require("./routes/favoriteShop");
const distanceRoutes = require("./routes/distance");
const configurationRoutes = require("./routes/configurationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliverymanRoutes = require("./routes/deliveryman");
const unitRoutes = require("./routes/unitRoutes");
const fcmRoutes = require("./routes/fcmRoutes");

// end points
app.use("/v2/withdraw", withdraw);
app.use("/v2/user", user);
app.use("/v2/conversation", conversation);
app.use("/v2/message", message);
app.use("/v2/order", order);
app.use("/v2/shop", shop);
app.use("/v2/product", product);
app.use("/v2/event", event);
app.use("/v2/coupon", coupon);
app.use("/v2/payment", payment);
app.use("/v2/notification", notification);

// New endpoints
app.use("/v2/modules", moduleRoutes);
app.use("/v2/categories", categoryRoutes);
app.use("/v2/subcategories", subcategoryRoutes);
app.use("/v2/user-products", userProductRoutes);
app.use("/v2/search", searchRoutes);
app.use("/v2/shops", shopRoutes);
app.use("/v2/shop-banners", shopBannerRoutes);
app.use("/v2/items", itemRoutes);
app.use("/v2/admin-banner", adminBannerRoutes);
app.use("/v2/favorites", favoriteRoutes);
app.use("/v2/cart", cartRoutes);
app.use("/v2/orders", orderHistoryRoutes);
app.use("/v2/favorite-shops", favoriteShopRoutes);
app.use("/v2/config", distanceRoutes);
app.use("/v2/settings", configurationRoutes);
app.use("/v2/admin", adminRoutes);
app.use("/v2/deliveryman", deliverymanRoutes);
app.use("/v2/units", unitRoutes);
app.use("/v2/fcm", fcmRoutes);
// it's for error handling
app.use(ErrorHandler);

// Handling Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling UNCAUGHT EXCEPTION! 💥`);
});

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
