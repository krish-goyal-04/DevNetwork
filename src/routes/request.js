const express = require("express");
const mongoose = require("mongoose");
const { ConnectionRequest } = require("../models/connectionRequest");
const { User } = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const { sanitizedConnectionData } = require("../utils/sanitizeData");
const requestRouter = express.Router();

//Since we are using left and right swipe feature, so there are 2 api calls
// and any other person who comes to the feed, is either accepted or ignored.
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const status = req.params.status;
      const toUserId = req.params.toUserId; //This is a string
      const loggedInUser = req.user;
      const loggedInUserId = loggedInUser._id; //This is an object Id

      if (!status || !toUserId)
        return res.status(400).json({ message: "Invalid status or user id!" });

      if (!mongoose.Types.ObjectId.isValid(toUserId)) {
        return res.status(400).json({ message: "Invalid requested user ID!" });
      }
      //Check for allowed request i.e, interested or ignored
      const allowedUpdates = ["interested", "ignored"];
      if (!allowedUpdates.includes(status))
        return res.status(400).json({ message: "Invalid status request!" });

      //throw error if user sends req to self
      if (loggedInUserId.toString() === toUserId)
        return res
          .status(400)
          .json({ message: "Can't send request to self !!!" });
      //Check if requested user exists or not in User schema
      const isUserAvailable = await User.findById(toUserId);
      if (!isUserAvailable)
        return res
          .status(400)
          .json({ message: "Requested user doesnot exist" });

      //Check if sender has already sent a request to receiver or vice-versa
      const doesReqExists = await ConnectionRequest.findOne({
        $or: [
          { toUserId: loggedInUserId, fromUserId: toUserId },
          { toUserId: toUserId, fromUserId: loggedInUserId },
        ],
      });
      if (doesReqExists)
        return res.status(409).json({ message: "Request already exists!" });

      const newRequest = new ConnectionRequest({
        toUserId: toUserId,
        fromUserId: loggedInUserId,
        status: status,
      });
      await newRequest.save();

      const safeData = sanitizedConnectionData(newRequest);

      return res
        .status(201)
        .json({ message: "Request Successfull!!!", data: safeData });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const status = req.params.status;
      const requestId = req.params.requestId; //requestId is the object id of the connectionRequest
      const loggedInUser = req.user;

      //check if status and request ids are present
      if (!status || !requestId)
        throw new Error("Invalid status or request id!");

      //Check only allowed actins, accepted or rejected
      const allowedUpdates = ["accepted", "rejected"];
      if (!allowedUpdates.includes(status))
        throw new Error("Invalid status request!!");

      const connReq = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      if (!connReq) throw new Error("Request cant be processed!!");
      connReq.status = status;
      await connReq.save();

      res.json({ message: `Request ${status} successfully!!!` });
    } catch (err) {
      res.send("ERROR : " + err.message);
    }
  },
);

module.exports = requestRouter;
