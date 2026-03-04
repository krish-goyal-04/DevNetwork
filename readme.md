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

.save() mehtod automatically runs all validators defined in schema or somewhere else when data is being added or updated.
but the encrypted password is not running because the save() is checking the encrypted password strength and not the original plain text, so we need to check passowrd strength before data ios saved in db.

### Doubt

if a and b both have sent req to c, and hile a is logged in, b intercepts a post req to see req sent, then b can get data of a , if b has user id of a
