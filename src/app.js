const express = require("express");

const { connectDB } = require("./config/database");
const { User } = require("./models/user");

const app = express();

app.use(express.json());

//API to create a new user
app.post("/signup", async (req, res) => {
  //sending dynamic data for signup
  try {
    const doesUserExists = await User.exists({ emailId: req.body.emailId });
    if (doesUserExists != null) {
      res.send("User already exists!");
      return;
    }
    const newUser = new User(req.body);
    await newUser.save();
    res.send("User Successfully added!");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//API to get a unique user details usin email id
app.get("/user", async (req, res) => {
  try {
    const userEmailId = req.body.emailId;
    const userDetails = await User.findOne({ emailId: userEmailId });
    console.log(userDetails);
    userDetails
      ? res.send(userDetails)
      : res.send("User with this email doesnot exist");
  } catch (err) {
    res.status(400).send("User Not Found!");
  }
});

//API to get all users,, Feed API
app.get("/feed", async (req, res) => {
  try {
    const allUsers = await User.find();
    allUsers ? res.send(allUsers) : res.status(404).send("No user found");
  } catch (err) {
    res.send("Error fetching all users!");
  }
});

//API to find user by id and update(PATCH)
app.patch("/user", async (req, res) => {
  const userId = req.body.userId;
  const data = req.body;
  try {
    await User.findByIdAndUpdate(userId, data);
    res.send("Data updated successfully!");
  } catch (err) {
    res.status(400).send("Failed to update data!");
  }
});

//API to delete a user by user id
app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  try {
    await User.findByIdAndDelete(userId);
    res.send("User deleted Successfully!");
  } catch (err) {
    res.status(400).send("Encontered an error in deleting the user!");
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
