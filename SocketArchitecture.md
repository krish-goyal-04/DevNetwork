# Socket.IO Architecture for DevNetwork Backend and Frontend

This document explains the Socket.IO architecture used by the DevNetwork project, including the backend and frontend design, the real-time chat workflow, and the notification architecture.

## What Socket.IO does

Socket.IO creates a persistent, bidirectional connection between the browser and the server.
It enables real-time events that allow data to move instantly without the browser reloading.

Socket.IO is more than a raw WebSocket library:

- It handles transport negotiation and fallbacks automatically.
- It supports reconnection, heartbeats, and message acknowledgment.
- It provides rooms and namespaces for event routing.

## Why we use Socket.IO here

The DevNetwork app uses Socket.IO for two real-time flows:

1. Notifications for connection request events
2. One-to-one private chat messages between connected users

Socket.IO is a good fit because it:

- allows instant delivery of messages and notifications
- reduces latency compared to polling
- keeps a single live channel open for each user session
- can handle multiple browser tabs by grouping sockets into rooms

## Backend architecture

### Server initialization

In `src/app.js`, the Express app is attached to an HTTP server:

- `const server = http.createServer(app)`
- `const io = new Server(server, { cors: {...} })`

This lets the same backend serve normal REST API routes and WebSocket events.

### Authentication middleware for sockets

Socket.IO uses middleware during the connection handshake.
The backend parses the browser cookies from `socket.handshake.headers.cookie`, verifies the JWT, and sets `socket.userId`.
Only authenticated sockets may connect.

This ensures all socket events are tied to a valid logged-in user.

### Personal rooms and presence

Each authenticated socket joins a personal room named:

- `user:<userId>`

That room is used to send messages or notifications to every active socket session for a user.
This supports:

- browser tabs
- multiple devices
- simultaneous sessions

Example: if a user is connected from laptop and mobile, both sockets share the same personal room.

### Connected user map

A `Map` is maintained in the backend:

- key: string user ID
- value: `Set` of socket IDs

That map is useful for determining online presence and cleaning up disconnected sockets.

### Private chat rooms

Private chat rooms are named deterministically:

- `chat:<smallerId>:<largerId>`

This guarantees the room name is the same for both users, regardless of who starts the chat.

Private rooms allow the server to broadcast a chat message to both participants in a conversation.

## Chat authorization and conversation validation

Chat is allowed only for users who are connected through an accepted connection request.
That means:

- the backend verifies the relationship before returning chat history
- the backend verifies the relationship before allowing socket chat events

This is enforced in both REST routes and Socket.IO event handlers.

## Backend chat routes

New backend routes provide:

- `GET /chat/participant/:userId`
  - fetches the partner's sanitized profile
  - verifies the users are connected
- `GET /chat/messages/:userId`
  - fetches message history between the logged-in user and the connected partner
  - returns messages sorted oldest to newest

The history route only returns messages if the users are in an accepted connection.

## Socket event names used in backend

The backend supports these socket events:

- `joinChat` — client asks to join a private chat room
- `chat:send` — client sends a new message
- `chat:message` — server broadcasts a saved message to the room

The `joinChat` event is a security step. The server checks connection status and admits the socket to the right private room.

## Chat message delivery flow

1. Client opens `/chat/:userId`
2. Client fetches partner profile and previous messages via REST
3. Client emits `joinChat` to join the private chat room
4. When the user sends a message, the client emits `chat:send`
5. Backend validates the chat relationship
6. Backend saves the message in MongoDB
7. Backend broadcasts the message to the private chat room using `chat:message`

This means both participants receive the same event, including the sender.

## Notifications architecture

Notifications for connection requests currently use these events:

- `request:received`
- `request:reviewed`

Those events are emitted from the backend when a connection request is created or reviewed.
They are sent to the recipient's personal room so all tabs/devices receive them.

Key detail:

- real-time notifications are separate from REST APIs
- the same socket connection receives both notifications and chat events

## Frontend architecture

The frontend shares a single Socket.IO connection across the app.

### Socket provider

A React context provides the socket instance from `Body.jsx` to child routes.
That means components like `Chat.jsx` can use the same live socket without creating multiple connections.

### Why React context is used

The app uses `SocketContext` so a single socket connection is created and reused by every component that needs it.
Without this, each page or component could create its own socket, which would waste resources and create duplicate connections.

- `SocketContext` is defined in `src/context/SocketContext.jsx`.
- `Body.jsx` creates the socket once and wraps the app in `SocketContext.Provider`.
- Child components use the `useSocket()` hook to access the shared socket.

This design keeps the socket connection central and avoids connection leaks.

### Connection lifecycle

The frontend behavior is:

- `Body.jsx` fetches the current user profile
- once authenticated, it initializes Socket.IO with credentials
- it attaches listeners for request and notification events
- it cleans up the socket on sign-out or unmount

### Chat page behavior

`Chat.jsx` does the following:

- reads the partner user ID from the URL
- loads partner profile and chat history from backend APIs
- waits for the shared socket to be ready
- emits `joinChat` for a private chat room
- listens for `chat:message`
- sends messages over `chat:send`

The page only shows the chat if the backend confirms the users are connected.
If the users are not connected, the route returns a clear error.

## Rooms in depth

Socket.IO rooms are logical groups, not separate protocols.
A room is simply a label attached to socket connections.

ROOM TYPES USED:

- personal room: `user:<userId>`
- private chat room: `chat:<sortedUserIdA>:<sortedUserIdB>`

ROOM PROPERTIES:

- a socket may join many rooms
- a room can have many sockets
- the same room can be reused across events
- sending to a room is a fast way to broadcast to a precise audience

### Why personal rooms?

Personal rooms allow any socket session owned by a user to receive notifications.
This is important because users can be logged in from multiple tabs or devices.

### Why private chat rooms?

Private chat rooms allow two connected users to share a conversation channel.
Messages sent to the chat room reach both participants simultaneously.

This setup is the right pattern for a direct message system without group chat.

## How to explain this in an interview

Tell the interviewer:

- Socket.IO is used because it delivers real-time events over the browser.
- The backend authenticates socket connections via the same JWT cookie used by REST.
- Every authenticated user joins a personal room so notifications can reach all active sessions.
- Chat messages use a deterministic private room name so the conversation channel is shared by both users.
- The backend enforces that chat is only possible for accepted connections.
- Message history is still persisted in MongoDB so offline users can fetch the conversation later.

## Summary

The DevNetwork socket architecture is built around:

- secure authenticated socket handshakes
- personal rooms for presence and notifications
- deterministic private chat rooms for one-on-one chat
- server-side validation of connection relationships
- REST endpoints for chat history and partner details

This design keeps real-time messaging fast, secure, and easy to reason about.
