const express = require("express");

const { connectDB } = require("./config/database");
const { User } = require("./models/user");
const { validateSignupUser, validateLoginUSer } = require("./utils/validate");
const bcrypt = require("bcrypt");
const cookie = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { userAuth } = require("./middlewares/auth");

const app = express();
dotenv.config();
app.use(express.json());
app.use(cookie());

//NEVER TRUST USER ENTERED DATA, ALWAYS PERFORM MULTIPLE POSSIBLE CHECKS!!!!!!!!

//API to create a new user
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, gender } = req.body;

    //validation (Putting these validations on seperate function to keep code clean)
    await validateSignupUser(req);

    //password encryption
    const encryptedPassword = await bcrypt.hash(password, 10);

    //Saving user to database
    const newUser = new User({
      firstName,
      lastName,
      emailId,
      gender,
      password: encryptedPassword,
    });
    await newUser.save();
    res.send("User Successfully added!");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.post("/login", async (req, res) => {
  console.log(req.body);
  const { emailId, password } = req.body;
  try {
    //Validating email
    await validateLoginUSer(req);
    const findUser = await User.findOne({ emailId: emailId });
    if (!findUser) throw new Error("Invalid credentials");

    const checkPassword = await findUser.validatePassword(password);
    if (!checkPassword) throw new Error("Invalid credentials");

    const token = await findUser.getJWT();
    //here we put finduser, as finduser here is the instance of the userSchema
    console.log(token);

    //Once the token in built, we send this token as a cookie

    res.cookie("token", token);
    res.send("Logged in Successfully!!");
  } catch (err) {
    res
      .status(400)
      .send("Unable to login, please try again" + "ERROR :" + err.message);
  }
});

app.get("/profile", userAuth, async (req, res) => {
  const { user } = req;
  res.send("Cookie sent" + user);
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
app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;

  try {
    //We cant allow the user to update some sensitive profile related information like email(once created, it should stay always),user id,etc.
    //So we create a Allowed updates string array to only allow those fields to be updated which doesnot affect the account relevance.
    //then we check out(using every()) all those unwanted/unsecured(in term of user account management) update requests(userid,email id,etc) from request body. If even any one exists, the request will fail.

    //The every() method in JavaScript is an array method that tests whether all elements in an array satisfy a specific condition provided by a callback function.

    const Allowed_Updates = [
      "firstName",
      "lastName",
      "description",
      "photoUrl",
      "skills",
    ];

    const isUpdateAllowed = Object.keys(data).every((k) =>
      Allowed_Updates.includes(k),
    );

    console.log(isUpdateAllowed);

    if (!isUpdateAllowed) {
      throw new Error("Requested update is not allowed!");
    }

    if (data?.skills && data.skills.length > 15) {
      throw new Error("Skills cant exceed 15 limit!!");
    }
    await User.findByIdAndUpdate(userId, data, { runValidators: true });

    //these {runValidators:true}, so that when data is modified, all the initial validators like lowecase, min,minLength,etc run respectively.

    res.send("Data updated successfully!");
  } catch (err) {
    res.status(400).send("Failed to update data!" + err.message);
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
