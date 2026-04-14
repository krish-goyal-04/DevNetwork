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

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const loggedInUserId = user._id;
    if (!user)
      return res
        .status(400)
        .json({ message: "User not found, Please try again!!" });

    const connectionsData = await ConnectionRequest.find({
      $or: [{ toUserId: user._id }, { fromUserId: user._id }],
      status: "accepted",
    }).populate("fromUserId toUserId", ["firstName", "lastName"]);
    console.log(connectionsData);
    //we should not return connectionsData, as it is raw data
    //it will contain Because you are returning:
    /* full connection document
      request ID
      both users
      status
      metadata
      This is internal DB structure, not what frontend needs
      
      we should give only users who are connected with basic details not everything we wrote in query*/

    if (connectionsData.length === 0)
      return res
        .status(200)
        .json({ message: "No connections found !!", data: [] });

    const safeData = connectionsData.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUserId.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });
    return res
      .status(200)
      .json({ message: "Connections fetched successfully!", data: safeData });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = userRouter;
