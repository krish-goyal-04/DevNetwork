const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

//User authentication middleware
//It first verifies the user's login status when user requests for a page or action
const userAuth = async (req, res, next) => {
  try {
    //Extracting the token from cookies which contains the user id
    //The token here is a jwt token of format header.secret message.digital signature
    const cookies = req.cookies;
    const { token } = cookies;
    if (!token) return res.status(401).json({ message: "No token provided!!" });

    //Using the token which contains user id to check wetheruser is logged in or not
    //first we will check wether the token exists in the cookies
    //if user does not exist then we will simply reject the user's request to access any page and then send error as a reponse
    //then extract the user id from it
    const decodedObj = jwt.verify(token, process.env.JWT_Private_Key);
    if (!decodedObj) return res.status(401).json({ message: "Invalid token" });

    //Extracting the user id from token
    const { _id } = decodedObj;
    if (!_id) return res.status(401).json({ message: "User not found!!" });
    //here we get confirmed that user exists, now we need to verify wether the requesting user and the logged in user are same

    //Once we have received the id of user, we will check the database if the user exists
    const user = await User.findById(_id);
    if (!user) return res.status(401).json({ message: "User not found!!" });
    //Till here if no errors are found, this implies that the user is verified and his/her request can be processed furthur
    //to the requested HTTP method
    //we will assign the user to the HTTP method byy attaching it with th request

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: err.message || "Authentication failed",
    });
  }
};

module.exports = { userAuth };
