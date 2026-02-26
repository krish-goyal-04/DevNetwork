const { userAuth } = require("../middlewares/auth");
const express = require("express");
const { validateProfileEditData } = require("../utils/validate");
const bcrypt = require("bcrypt");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const { user } = req;
    res.send(user);
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    //Validate wether the user hasnt requested to update email or password(separate process/api for password update)
    //if so, throw error
    await validateProfileEditData(req, res);

    //using userAuth middleware we are verifying the current login user
    //now since req.user has logged in user details, we will extract it and update it

    const loggedInUser = req.user;

    //forEach always returns undefined
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    await loggedInUser.save();

    res.json({
      data: loggedInUser,
      message: `${loggedInUser.firstName} your profile details have been updated successfully!!`,
    });

    //update data in db
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
});

profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    if (!req.body.password) throw new Error("Invalid request!");
    const user = req.user;

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (isMatch) throw new Error("Old password cant be repeated!!");

    const newPassword = await bcrypt.hash(req.body.password, 10);
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully!!" });
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
});

module.exports = profileRouter;
