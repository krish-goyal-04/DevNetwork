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
