const express = require("express");

const app = express();

app.use("/test", (req, res) => {
  res.send("Testing the server!!!");
});

app.use("/namaste", (req, res) => {
  res.send("Namste from server!!!");
});

app.use("/", (req, res) => {
  res.send("Hello from server!!!");
});

app.listen(3000, () => {
  console.log("App is running on port 3000...");
});
