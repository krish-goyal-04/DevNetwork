const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(
    `mongodb+srv://krish:${process.env.mongodbPass}@learningmongo1.utwidrh.mongodb.net/devNetwork`,
  );
};

module.exports = { connectDB };
