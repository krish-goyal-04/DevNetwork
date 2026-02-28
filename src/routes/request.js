const express = require("express");
const { ConnectionRequest } = require("../models/connectionRequest");
const { User } = require("../models/user");
const { userAuth } = require("../middlewares/auth");

const requestRouter = express.Router();

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const status = req.params.status;
      const toUserId = req.params.toUserId;
      const loggedInUser = req.user;
      const loggedInUserId = loggedInUser._id;

      if (!status || !toUserId) throw new Error("Invalid status or user id!");

      //Check for allowed request i.e, interested or ignoreed
      const allowedUpdates = ["interested", "ignored"];
      if (!allowedUpdates.includes(status))
        throw new Error("Invalid status request!");

      //Check if requested user exists or not in User schema
      const isUserAvailable = await User.findById(toUserId);
      if (!isUserAvailable) throw new Error("Requested user doesnot exist");

      //Check if sender has already sent a request to receiver or vice-versa
      const doesReqExists = await ConnectionRequest.findOne({
        $or: [
          { toUserId: loggedInUserId, fromUserId: toUserId },
          { toUserId: toUserId, fromUserId: loggedInUserId },
        ],
      });
      if (doesReqExists) throw new Error("Request already exists!");

      const newRequest = new ConnectionRequest({
        toUserId: toUserId,
        fromUserId: loggedInUserId,
        status: status,
      });
      await newRequest.save();

      res.json({ message: "Request Successfull!!!", data: newRequest });
    } catch (err) {
      res.send("ERROR : " + err.message);
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
