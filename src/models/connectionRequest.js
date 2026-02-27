const mongoose = require("mongoose");
const { Schema } = mongoose;

const connectionRequestSchema = new Schema(
  {
    fromUserId: {
      type: mongoose.Types.ObjectId(),
      required: true,
    },
    toUserId: {
      type: mongoose.Types.ObjectId(),
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["interested", "rejected", "accepted", "ignored"],
        message: "{VALUE}  isnot a valid status.",
      },
    },
  },
  { timestamps: true },
);
const ConnectionRequest = mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema,
);
module.exports = { ConnectionRequest };
