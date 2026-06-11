wesocket is a communication protocol like http,smtp,ftp,etc
Difference between HTTTP server and NodeJs server

HTTP Server (Node.js core)

This is the raw server provided by Node.js using the built-in http module.

Example:

const http = require("http");

const server = http.createServer((req, res) => {
res.write("Hello");
res.end();
});

server.listen(3000);
What it does
Handles:
TCP connections
HTTP requests/responses
Low-level networking
You manually:
Parse routes
Parse body
Set headers
Handle methods
Create APIs
Characteristics
Low-level
Minimal
Fast
More boilerplate
Harder for large apps

Express Server

Express.js is a framework built on top of Node’s HTTP server.

Example:

const express = require("express");

const app = express();

app.get("/", (req, res) => {
res.send("Hello");
});

app.listen(3000);
What Express adds

Express internally creates and uses an HTTP server for you.

It provides:

Routing
Middleware
JSON parsing
Error handling
Cookies
Authentication support
Easier APIs

Instead of:

if(req.url === "/user" && req.method === "GET")

you write:

app.get("/user")
Internally What Happens

When you do:

app.listen(3000)

Express actually does something similar to:

const http = require("http");

const server = http.createServer(app);

So:

TCP Socket
↓
HTTP Server (Node)
↓
Express App
↓
Routes/Middleware

Important Concept

Many developers say:

“Express server”

But technically:

Express itself is not the actual network server.
Node’s HTTP server is the real server.
Express is a request handler framework sitting on top of it.

### Socket.IO attaches to the HTTP server, not directly to Express.

WebSockets upgrade from an HTTP connection
The actual HTTP server handles that upgrade

Then Why Do We Manually Create HTTP Server Sometimes?

Because Express hides the server instance from you.

With:

app.listen(3000);

you don’t directly get access to:

server

And some technologies need the actual server object.

Example:

Socket.IO
WebSockets
HTTPS upgrades
raw TCP handling

These need:

const server = http.createServer(app);

because they attach to the real HTTP server.

What Happens Internally
Case 1 — Simple Express
app.listen(3000);

Internally:

const server = http.createServer(app);

server.listen(3000);

But Express hides server.

Case 2 — Manual HTTP Server
const server = http.createServer(app);

server.listen(3000);

Now YOU control the server object.

So you can do:

const io = new Server(server);

Why Express Hides It

Because most developers don’t need low-level server access.

For normal REST APIs:

app.get()
app.post()
app.use()

is enough.

So Express simplifies everything.

Sender creates request:

UI → POST /request/send/... (REST) → backend saves request in DB (request.js).
Backend emits request:received to the target user’s socket (via io / connectedUsers in app.js).
Frontend socket (opened in DevNetwork Frontend/src/components/Body.jsx) receives request:received, transforms payload to the UI shape and dispatches addRequests(...) into the requests slice (requestsSlice.js).
Requests.jsx reads the slice and renders the new card immediately (no refresh).
Reviewer accepts/rejects:

Reviewer clicks → POST /request/review/... (REST) → backend updates DB and emits request:reviewed to the original sender.
Reviewer UI dispatches removeRequest(connectionId) locally so their card disappears immediately.
Sender’s socket receives request:reviewed (in Body.jsx), frontend dispatches handleRequestReview (or another action) to update/remove the request in the sender’s Redux state.
Sender’s UI updates immediately (no refresh). Optionally show toast / update connections slice when accepted.
Why it used to require a refresh

Payload shape mismatch: socket payload nested fromUser but UI components expect fields at top level, so cards showed fallbacks like “unknown”. After flattening/transformation on receipt, the UI gets the expected fields.
Missing sender-side handling: there was no handler to process request:reviewed events and update sender’s Redux, so the sender didn’t see acceptance/rejection until a REST fetch (refresh).
Socket not connected / not authenticated: if the socket wasn’t open or the JWT cookie wasn’t sent, backend couldn’t deliver events — leading to no realtime updates.
Quick checks to confirm realtime behavior

Open two clients (different users), watch DevTools Console:
On send: backend logs emit; target receives request:received event.
On review: reviewer’s request disappears locally; sender receives request:reviewed event.
Inspect Redux requests slice in React DevTools — it should change immediately on the socket events.
Verify cookie/token sent on socket handshake (so io middleware authenticates the socket).
Edge cases and notes

Offline users don’t get socket events (you still rely on REST on next fetch). Consider persistent notifications if you need guaranteed delivery.
Multi-tab: current connectedUsers stores one socket id per user; multiple tabs may overwrite. Use a set of socket IDs per user to support multi-tab.
Optional: show a toast on request:reviewed and update feed/connections slices when accepted.

Here’s a concise end-to-end explanation of how realtime notifications work and how the server notifyUser ties into the client socket in Body.jsx.

How server-side notifyUser works

Location: DevNetwork/src/routes/request.js (function notifyUser).
Behavior: it reads the Socket.IO io instance and a connectedUsers map from the Express app, looks up the recipient’s socket id by userId, and calls io.to(socketId).emit(event, payload).
Result: the server sends a targeted socket event only to the socket id returned by the map (so only the online recipient receives it).
Where the socket id map comes from

The app (in your socket setup file, e.g. app.js) accepts socket connections, authenticates the user (cookie/JWT), and stores a mapping connectedUsers.set(userId, socket.id). On disconnect it removes that mapping. That map is attached to req.app so notifyUser can access it.
Typical trigger flow (request send → recipient notified)

Client calls REST endpoint POST /request/send/:status/:toUserId.
Server saves a ConnectionRequest in DB.
Server calls notifyUser(req, toUserId, "request:received", payload) (only when status == "interested" after your patch).
notifyUser finds recipient’s socket id and emits the event to that socket.
How the frontend receives & uses it

Location: DevNetwork Frontend/src/components/Body.jsx
Body.jsx opens a Socket.IO client (io(baseURL, { withCredentials: true, transports: ['websocket'] })), listens for events like request:received and request:reviewed, then:
transforms the payload to match Redux shape (e.g., flatten fromUser into a request object),
dispatches Redux actions (addRequests, handleRequestReview),
shows a toast notification via your ToastNotification helper.
Why an “ignored” (skipped) request produced a notification previously

The server originally emitted request:received for every saved request regardless of status. That caused recipients to get notified even when the sender had chosen ignored.
You fixed this by only calling notifyUser when status === "interested", so skipped swipes are persisted but not emitted as real-time notifications.
Quick troubleshooting checklist (if notifications aren’t showing)

Verify the client socket is connected (browser console shows socket id).
Confirm connectedUsers contains the recipient’s userId → socketId mapping on server.
Ensure event names match exactly between server emit and client listener (request:received, request:reviewed).
Check cookies/JWT used for socket auth are sent (withCredentials: true) so server can map the socket to a user.
Inspect network WS frames (browser devtools → Network → WS) to see emitted events.
Confirm payload shape matches what the frontend code expects before dispatching reducers.
