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

      //Check for allowed request i.e, interested and ignoreed
      const allowedUpdates = ["interested", "ignored"];

      const user = req.user;
    } catch (err) {}
  },
);

module.exports = { requestRouter };
