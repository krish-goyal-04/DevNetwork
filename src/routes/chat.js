const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middlewares/auth");
const { User } = require("../models/user");
const ChatMessage = require("../models/chatMessages");
const { sanitizedUserData } = require("../utils/sanitizeData");
const { areUsersConnected } = require("../utils/socketHelpers");

const chatRouter = express.Router();

// Get the chat participant's details for a given userId, but only if the logged-in user is connected with that user.
// This endpoint is used to display the chat header with the participant's name and info. It also serves as an access control check to ensure users can only chat with their connections.
chatRouter.get("/chat/participant/:userId", userAuth, async (req, res) => {
  try {
    const participantId = req.params.userId;
    const loggedInUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: "User not found." });
    }

    const connected = await areUsersConnected(loggedInUserId, participantId);
    if (!connected) {
      return res
        .status(403)
        .json({ message: "You are not connected with this user." });
    }

    return res.status(200).json({ data: sanitizedUserData(participant) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

chatRouter.get("/chat/messages/:userId", userAuth, async (req, res) => {
  try {
    const participantId = req.params.userId;
    const loggedInUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const connected = await areUsersConnected(loggedInUserId, participantId);
    if (!connected) {
      return res
        .status(403)
        .json({ message: "You are not connected with this user." });
    }

    const messages = await ChatMessage.find({
      $or: [
        { fromUserId: loggedInUserId, toUserId: participantId },
        { fromUserId: participantId, toUserId: loggedInUserId },
      ],
    }).sort({ createdAt: 1 });

    const formattedMessages = messages.map((message) => ({
      _id: message._id,
      fromUserId: message.fromUserId.toString(),
      toUserId: message.toUserId.toString(),
      message: message.message,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      fromSelf: message.fromUserId.toString() === loggedInUserId.toString(),
      messageType: message.messageType,
    }));

    return res.status(200).json({ data: formattedMessages });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = chatRouter;
