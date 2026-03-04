const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { ConnectionRequest } = require("../models/connectionRequest");

const userRouter = express.Router();

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    //getting the user
    const user = req.user;

    //find user data in connectionRequest db and filter out interested status requested sent to current user by other users
    const data = await ConnectionRequest.find({
      toUserId: user._id,
      status: "interested",
    }).populate("fromUserId", ["firstName", "lastName"]);
    if (data.length === 0) res.json({ message: "No requests received" });

    res.json({ data, message: "Requests fetcheed successfully!!" });
  } catch (err) {
    res.send("ERROR :" + err.message);
  }
});

module.exports = userRouter;
