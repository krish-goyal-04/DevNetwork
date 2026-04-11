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
    throw new Error("Cant send request to self!!!");
});

const ConnectionRequest = mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema,
);
module.exports = { ConnectionRequest };
