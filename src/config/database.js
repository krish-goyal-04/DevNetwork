const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.mongodbURL);
  mongoose.connection.once("open", () => {
    console.log("Connected DB:", mongoose.connection.name);
  });
};

module.exports = { connectDB };
