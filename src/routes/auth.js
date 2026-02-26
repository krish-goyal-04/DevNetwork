const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateSignupUser, validateLoginUSer } = require("../utils/validate");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");

const authRouter = express.Router();

//POST api to create a new user
authRouter.post("/signup", async (req, res) => {
  try {
    //validation (Putting these validations on seperate function to keep code clean)
    await validateSignupUser(req, res);

    const { firstName, lastName, emailId, password, gender } = req.body;

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

//POST api fo login
authRouter.post("/login", async (req, res) => {
  try {
    //Validating email
    await validateLoginUSer(req, res);
    const { emailId, password } = req.body;
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
      .send("Unable to login, please try again /n" + "ERROR :" + err.message);
  }
});

authRouter.post("/logout", userAuth, async (req, res) => {
  try {
    res.clearCookie("token");
    res.send("Cookie deleted");
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
});

module.exports = authRouter;
