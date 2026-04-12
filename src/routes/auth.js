const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateSignupUser, validateLoginUSer } = require("../utils/validate");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");

const authRouter = express.Router();

//POST api to create a new user
authRouter.post("/signup", validateSignupUser, async (req, res) => {
  try {
    //validation (Putting these validations on seperate function to keep code clean)
    //await validateSignupUser(req, res); -- this wont stop execution, so we are using this as middleware

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
    return res.status(200).json({ message: "User Successfully added!" });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "User already exists !!" });
    return res.status(500).send(err.message);
  }
});

//POST api fo login
authRouter.post("/login", validateLoginUSer, async (req, res) => {
  try {
    //Validating email
    //await validateLoginUSer(req, res);
    const { emailId, password } = req.body;
    const findUser = await User.findOne({ emailId: emailId });
    if (!findUser)
      return res.status(400).json({ message: "Invalid Credentials !!" });

    const checkPassword = await findUser.validatePassword(password);
    if (!checkPassword)
      return res.status(400).json({ message: "Invalid Credentials !!" });

    const token = await findUser.getJWT();
    //here we put finduser, as finduser here is the instance of the userSchema
    //console.log(token);

    //Once the token in built, we send this token as a cookie

    res.cookie("token", token);
    res.status(200).json({ message: "Logged in Successfully!!" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Unable to login, please try again /n" + err.message });
  }
});

authRouter.post("/logout", userAuth, async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully !!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = authRouter;
