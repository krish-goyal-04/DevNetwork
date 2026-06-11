const express = require("express");

const { connectDB } = require("./config/database");
const { User } = require("./models/user");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { userAuth } = require("./middlewares/auth");
const cors = require("cors");
const {
  getPersonalRoomName,
  getPrivateChatRoomName,
  areUsersConnected,
} = require("./utils/socketHelpers");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");

// http module is used to create a server and socket.io is used for real-time communication between the client and server. We are using socket.io to create a WebSocket connection between the client and server, which allows us to send and receive data in real-time without the need for the client to refresh the page. This is particularly useful for features like notifications, chat applications, or any functionality that requires instant updates.

const http = require("http");
const { Server } = require("socket.io");

const app = express();

// We are creating an HTTP server using the built-in http module and passing our Express app to it. This allows us to use the same server for both our Express routes and our Socket.IO connections. By doing this, we can handle regular HTTP requests as well as real-time WebSocket connections on the same server instance.
const server = http.createServer(app);
dotenv.config();
app.use(express.json());
app.use(cookieParser());
// We are initializing a new instance of the Socket.IO server and attaching it to our HTTP server. This allows us to handle WebSocket connections and real-time communication between the client and server. The CORS configuration is set to allow requests from "http://localhost:5173" and to include credentials (like cookies) in the requests, which is important for authentication and maintaining user sessions.

// The CORS configuration is set to allow requests from "http://localhost:5173" and to include credentials (like cookies) in the requests, which is important for authentication and maintaining user sessions.

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const connectedUsers = new Map();

// This map stores the currently connected socket id for each authenticated user.
// It is used to deliver real-time events only to the recipient who is online.
// Note: this simple Map stores one socket id per user. If the same user opens multiple tabs, the latest connection will overwrite the previous one.
// For multi-tab support, use a Map<string, Set<string>> and emit to all socket ids for that user.

// app.set is used to store the io instance and connectedUsers map in the Express app instance,
// allowing route handlers to access them through req.app.get(...).
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// Socket.IO middleware for authentication. This middleware runs for every incoming Socket.IO connection and checks if the client has a valid JWT token in their cookies. If the token is valid, it extracts the user ID from the token and attaches it to the socket object, allowing us to identify the user associated with each WebSocket connection. If the token is missing or invalid, the connection is rejected with an authentication error. This ensures that only authenticated users can establish a WebSocket connection with our server.
io.use((socket, next) => {
  try {
    //We are parsing the cookies from the socket handshake headers to extract the JWT token. The token is then verified using the JWT secret key, and if valid, the user ID is extracted and attached to the socket object for later use in identifying the user during real-time interactions.
    const rawCookie = socket.handshake.headers.cookie || "";

    const cookies = cookie.parse(rawCookie);

    const token = cookies.token;

    if (!token) return next(new Error("Authentication error"));

    const decoded = jwt.verify(token, process.env.JWT_Private_Key);

    if (!decoded || !decoded._id)
      return next(new Error("Authentication error"));

    socket.userId = decoded._id;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});
//even after cors is set up in socket.io, we also need to set it up in express to allow cross-origin requests for our API endpoints. This ensures that our frontend application can communicate with our backend server without any CORS issues, allowing us to make API calls and receive responses successfully.
// We are using the CORS middleware in our Express app to allow cross-origin requests from "http://localhost:5173". This is necessary because our frontend application (running on a different port) needs to communicate with our backend server, and without this configuration, the browser would block these requests due to CORS policy. By allowing credentials, we also enable the use of cookies for authentication and session management between the client and server.

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// NEVER TRUST USER ENTERED DATA, ALWAYS PERFORM MULTIPLE POSSIBLE CHECKS!!!!!!!!

// Any request that comes will match with the routes defined in authRouter, profileRouter, requestRouter, userRouter.
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

// Socket.IO connection handling for authenticated users.
// Each logged-in socket joins a personal room so we can send notifications and chat events to all active tabs/devices.
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, "userId:", socket.userId);

  if (socket.userId) {
    const userIdString = socket.userId.toString();
    const userRoom = getPersonalRoomName(userIdString);

    // Keep a set of socket ids per user to support multi-tab sessions.
    // When a socket connects, we add it to the user's personal room and update the connectedUsers map to track all active sockets for that user. This allows us to send real-time notifications and messages to all of the user's active sessions, ensuring that they receive updates regardless of which tab or device they are using.
    socket.join(userRoom);
    const existingSockets = connectedUsers.get(userIdString) || new Set();
    existingSockets.add(socket.id);
    connectedUsers.set(userIdString, existingSockets);

    // Event: request:received
    // Triggered when ANOTHER user sends a connection request to the logged-in user.
    // Payload: { connectionId, status, fromUser: {...}, createdAt }

    socket.on("joinChat", async ({ participantId }, callback) => {
      try {
        if (!participantId) {
          return callback?.({
            status: "error",
            message: "Participant id missing.",
          });
        }

        const connected = await areUsersConnected(userIdString, participantId);
        if (!connected) {
          return callback?.({
            status: "error",
            message: "You are not connected with this user.",
          });
        }

        const chatRoom = getPrivateChatRoomName(userIdString, participantId);
        socket.join(chatRoom);
        return callback?.({ status: "ok", room: chatRoom });
      } catch (err) {
        return callback?.({ status: "error", message: err.message });
      }
    });

    socket.on("chat:send", async ({ toUserId, message }, callback) => {
      try {
        if (!toUserId || typeof message !== "string" || !message.trim()) {
          return callback?.({
            status: "error",
            message: "Invalid chat payload.",
          });
        }

        const connected = await areUsersConnected(userIdString, toUserId);
        if (!connected) {
          return callback?.({
            status: "error",
            message: "You are not connected with this user.",
          });
        }

        const chatRoom = getPrivateChatRoomName(userIdString, toUserId);
        const ChatMessage = require("./models/chatMessages");
        const isRecipientOnline = connectedUsers.has(toUserId.toString());
        const savedMessage = await new ChatMessage({
          fromUserId: socket.userId,
          toUserId,
          message: message.trim(),
          status: isRecipientOnline ? "delivered" : "sent",
        }).save();

        const payload = {
          _id: savedMessage._id,
          fromUserId: savedMessage.fromUserId.toString(),
          toUserId: savedMessage.toUserId.toString(),
          message: savedMessage.message,
          status: savedMessage.status,
          createdAt: savedMessage.createdAt,
          updatedAt: savedMessage.updatedAt,
          messageType: savedMessage.messageType,
          fromSelf: savedMessage.fromUserId.toString() === userIdString,
        };

        io.to(chatRoom).emit("chat:message", payload);
        io.to(getPersonalRoomName(toUserId)).emit("notification:message", {
          fromUserId: userIdString,
          toUserId,
          snippet: payload.message.slice(0, 120),
        });

        return callback?.({ status: "ok" });
      } catch (err) {
        return callback?.({ status: "error", message: err.message });
      }
    });
  }

  socket.on("disconnect", () => {
    if (socket.userId) {
      const userIdString = socket.userId.toString();
      const existingSockets = connectedUsers.get(userIdString);
      if (existingSockets) {
        existingSockets.delete(socket.id);
        if (existingSockets.size === 0) {
          connectedUsers.delete(userIdString);
        } else {
          connectedUsers.set(userIdString, existingSockets);
        }
      }
    }
    console.log("A user disconnected:", socket.id);
  });
});

connectDB()
  .then(() => {
    console.log("Connected to the mongodb successfully");
    server.listen(3000, () => {
      console.log("App is running on port 3000...");
    });
  })
  .catch((err) => {
    console.log(err);
  });
