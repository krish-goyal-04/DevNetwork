const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      default: "sent",
      enum: {
        values: ["sent", "delivered", "read"],
        message: "{VALUE} is not a valid status.",
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    messageType: {
      type: String,
      default: "text",
      enum: {
        values: ["text", "image", "file"],
        message: "{VALUE} is not a valid message type.",
      },
    },
  },

  { timestamps: true },
);

chatMessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;
