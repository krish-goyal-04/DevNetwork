const { userAuth } = require("../middlewares/auth");
const express = require("express");
const { validateProfileEditData } = require("../utils/validate");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { sanitizedUserData } = require("../utils/sanitizeData");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const { user } = req;
    //the user contains all the data which should not be sent/not
    // required like password etc

    const safeData = sanitizedUserData(user);
    return res
      .status(200)
      .json({ data: safeData, message: "Profile fetched successfully !!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

profileRouter.patch(
  "/profile/edit",
  userAuth,
  validateProfileEditData,
  async (req, res) => {
    try {
      //Validate wether the user hasnt requested to update email or password(separate process/api for password update)
      //if so, throw error
      //if we call this method instead f using it as middleware then we will again get
      //  ERR_HTTP_HEADERS_SENT which means even after a res is sent the pgm continues furthur execution
      //await validateProfileEditData(req, res);

      //using userAuth middleware we are verifying the current login user
      //now since req.user has logged in user details, we will extract it and update it

      const loggedInUser = req.user;

      //forEach always returns undefined
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          loggedInUser[key] = req.body[key];
        }
      });
      await loggedInUser.save();
      const safeData = sanitizedUserData(loggedInUser);
      return res.status(200).json({
        data: safeData,
        message: `${safeData.firstName} your profile details have been updated successfully!!`,
      });

      //update data in db
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    const newEnteredPassword = req.body.password;
    if (!newEnteredPassword)
      return res.status(400).json({ message: "Invalid request !!" });

    if (!validator.isStrongPassword(newEnteredPassword))
      return res.status(400).json({ message: "Enter a strong password!!!" });

    const user = req.user;
    const oldPasswordHash = user.password;

    const isMatch = await bcrypt.compare(newEnteredPassword, oldPasswordHash);
    if (isMatch)
      return res
        .status(400)
        .json({ message: "Previous passwords cant be repeated!!" });

    const newPassword = await bcrypt.hash(newEnteredPassword, 10);
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed successfully!!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = profileRouter;
