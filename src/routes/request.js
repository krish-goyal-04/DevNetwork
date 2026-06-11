const express = require("express");
const mongoose = require("mongoose");
const { ConnectionRequest } = require("../models/connectionRequest");
const { User } = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const {
  sanitizedConnectionData,
  sanitizedUserData,
} = require("../utils/sanitizeData");
const { getPersonalRoomName } = require("../utils/socketHelpers");
const requestRouter = express.Router();

// Emit a real-time socket event to a connected target user.
// If the target user is not currently connected via WebSocket, this function quietly does nothing.
// That means the notification arrives instantly only when the recipient is online.
const notifyUser = async (req, userId, event, payload) => {
  const io = await req.app.get("io");
  if (!io) return;
  const userRoom = getPersonalRoomName(userId.toString());
  io.to(userRoom).emit(event, payload);
};

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

      //Check if requested user exists or not in User schema
      const isUserAvailable = await User.findById(toUserId);
      if (!isUserAvailable)
        return res
          .status(400)
          .json({ message: "Requested user does not exist" });

      //Check if sender has already sent a request to receiver or vice-versa
      const doesReqExists = await ConnectionRequest.findOne({
        $or: [
          { toUserId: loggedInUserId, fromUserId: toUserId },
          { toUserId: toUserId, fromUserId: loggedInUserId },
        ],
      });
      if (doesReqExists)
        return res.status(409).json({ message: "Request already exists!" });

      const newRequest = await new ConnectionRequest({
        toUserId: toUserId,
        fromUserId: loggedInUserId,
        status: status,
      });
      await newRequest.save();

      const safeData = sanitizedConnectionData(newRequest);
      // Only notify the recipient for meaningful requests ("interested").
      // If the sender swipes "ignored", we persist the record but do not send a real-time notification.
      if (status === "interested") {
        await notifyUser(req, toUserId, "request:received", {
          connectionId: newRequest._id,
          status: newRequest.status,
          fromUser: sanitizedUserData(loggedInUser),
          createdAt: newRequest.createdAt,
        });
      }

      return res
        .status(201)
        .json({ message: "Request Successfull!!!", data: safeData });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
);

//using this api, user can accept/reject a req which has came to the loggedin user and the status is interested
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
        return res
          .status(400)
          .json({ message: "Invalid status or request id!" });

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ message: "Invalid requested ID!" });
      }
      //Check only allowed actions, accepted or rejected
      const allowedUpdates = ["accepted", "rejected"];
      if (!allowedUpdates.includes(status))
        return res.status(400).json({ message: "Invalid status request!!" });

      const connReq = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      if (!connReq)
        return res
          .status(404)
          .json({ message: "Request not found or already processed!!" });
      connReq.status = status;
      await connReq.save();
      notifyUser(req, connReq.fromUserId, "request:reviewed", {
        connectionId: connReq._id,
        status,
        toUserId: connReq.toUserId,
        toUser: sanitizedUserData(loggedInUser),
      });

      return res
        .status(200)
        .json({ message: `Request ${status} successfully!!!` });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
);

module.exports = requestRouter;
