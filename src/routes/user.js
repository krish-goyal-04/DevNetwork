const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { ConnectionRequest } = require("../models/connectionRequest");

const userRouter = express.Router();

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    //getting the user
    const user = req.user;

    //find user data in connectionRequest db and filter out interested status requested sent to current user by other users
    //i.e it gives data of users who have sent connection request to the loggedIn user
    const data = await ConnectionRequest.find({
      toUserId: user._id,
      status: "interested",
    })
      .populate("fromUserId", ["firstName", "lastName"])
      .sort({ createdAt: -1 }); //Populate method would allow us to avoid overfetching of data
    //here we can also pass data in a string separated by comma ex: "firstName lastName skills age"

    //sorting the response based on lastest to oldest (i.e., descending order)
    if (data.length === 0)
      return res.status(200).json({ message: "No requests received" });

    return res
      .status(200)
      .json({ data, message: "Requests fetched successfully!!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

//API which gives users all their connections, to whom they sent a req, or form whom the received the req
// and in both cases the satus is accepted

//It has some bug, check it first
userRouter.get("user/connections", userAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) res.json("User not found, Please try again!!");

    const connectionsData = await ConnectionRequest.find({
      $or: [{ toUserId: user._id }, { fromUserId: user._id }],
      status: "accepted",
    }).populate("fromUserId", ["firstName", "lastName"]);

    if (connectionsData.length === 0)
      res.json({ message: "No connections found !!" });

    res.json({ message: "Connections fetched successfully!", connectionsData });
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
});

module.exports = userRouter;
