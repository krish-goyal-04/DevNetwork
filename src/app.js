const express = require("express");

const { connectDB } = require("./config/database");
const { User } = require("./models/user");
const cookie = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { userAuth } = require("./middlewares/auth");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

const app = express();
dotenv.config();
app.use(express.json());
app.use(cookie());

//NEVER TRUST USER ENTERED DATA, ALWAYS PERFORM MULTIPLE POSSIBLE CHECKS!!!!!!!!

//any req that comes will match with the routes defined in authrouter,profilerouter,etc...if it matched,,it gets executed
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

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
