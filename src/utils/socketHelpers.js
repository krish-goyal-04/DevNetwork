const mongoose = require("mongoose");
const { ConnectionRequest } = require("../models/connectionRequest");

// A personal room is used for delivering notifications and messages to all active sockets
// for a single authenticated user. This supports multi-tab and multi-device sessions.
const getPersonalRoomName = (userId) => `user:${userId}`;

// A private chat room is a deterministic room name for two users.
// Sorting the IDs ensures the same room name is used regardless of sender/recipient order.
const getPrivateChatRoomName = (userIdA, userIdB) => {
  const sortedIds = [userIdA.toString(), userIdB.toString()].sort();
  return `chat:${sortedIds[0]}:${sortedIds[1]}`;
};

// Verify that two users have an accepted connection request between them.
// This enforces that chat can only happen between connected users.
const areUsersConnected = async (userId, otherUserId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return false;
  if (!mongoose.Types.ObjectId.isValid(otherUserId)) return false;

  const connection = await ConnectionRequest.findOne({
    status: "accepted",
    $or: [
      { fromUserId: userId, toUserId: otherUserId },
      { fromUserId: otherUserId, toUserId: userId },
    ],
  });

  return Boolean(connection);
};

module.exports = {
  getPersonalRoomName,
  getPrivateChatRoomName,
  areUsersConnected,
};
