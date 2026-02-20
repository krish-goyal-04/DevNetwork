const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://krish:Krish2003@learningmongo1.utwidrh.mongodb.net/devNetwork",
  );
};

module.exports = { connectDB };
