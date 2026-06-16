const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.mongodbURL);
};

module.exports = { connectDB };
