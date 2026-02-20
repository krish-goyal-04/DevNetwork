const express = require("express");

const { connectDB } = require("./config/database");
const { User } = require("./models/user");
const app = express();

app.post("/signup", async (req, res) => {
  const dummyObj = {
    firstName: "Krish",
    lastName: "Goyal",
    gender: "Male",
    age: 22,
    emailId: "Krish@123",
  };

  try {
    const newUser = new User(dummyObj);
    await newUser.save();
    res.send("User Successfully added!");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

connectDB()
  .then(() => {
    console.log("Connected to the mongodb successfully");
    app.listen(3000, () => {
      console.log("App is running on port 3000...");
    });
  })
  .catch((err) => {
    console.log(err);
  });
