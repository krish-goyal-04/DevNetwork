const { userAuth } = require("../middlewares/auth");
const express = require("express");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  const { user } = req;
  res.send("Cookie sent" + user);
});

module.exports = profileRouter;
