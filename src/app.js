const express = require("express");

const { connectDB } = require("./config/database");
const { User } = require("./models/user");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { userAuth } = require("./middlewares/auth");
const cors = require("cors");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

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

//NEVER TRUST USER ENTERED DATA, ALWAYS PERFORM MULTIPLE POSSIBLE CHECKS!!!!!!!!

//any req that comes will match with the routes defined in authrouter,profilerouter,etc...if it matched,,it gets executed
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

// Socket.IO connection handling. When a client connects to the server via WebSocket, this event is triggered. We can use this to set up listeners for specific events that the client might emit, such as "joinRoom" or "leaveRoom". This allows us to manage real-time interactions between clients, such as joining chat rooms or sending notifications.

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, "userId:", socket.userId);
  if (socket.userId) {
    connectedUsers.set(socket.userId.toString(), socket.id);
  }

  socket.on("disconnect", () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId.toString());
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
