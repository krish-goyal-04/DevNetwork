const mongoose = require("mongoose");
const { Schema } = mongoose;

const connectionRequestSchema = new Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", //This tells the fromUserId is a reference from user table
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
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

//Check if user is not trying to send interested/ignored to self
//it runs as a middleware, before the data is saved in db
connectionRequestSchema.pre("save", function () {
  const fromUserId = this.fromUserId;
  if (fromUserId.equals(this.toUserId))
    throw new Error("Can't send request to self!!!");
});

//Compound index to avoid more than 1 req from A to B
//but it is direction sesitive. i.e A->B only one allowed, multiple will be blocked
//but B->A is allowed (only one)
//For it we are checking that in requests api
//This part just avoids race condition when more than 1 user req for same fromUserId to toUserId
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
const ConnectionRequest = mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema,
);
module.exports = { ConnectionRequest };
