const mongoose = require("mongoose");
const validator = require("validator"); //Using this validator npm lirary to check and sanitize data before pushing into database.
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

dotenv.config();

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 25,
      trim: true,
      validate(value) {
        if (!validator.isAlpha(value.replace(/\s/g, "")))
          throw new Error(
            "Numbers and Special characters are not allowed in first name!",
          );
      },
    },
    lastName: {
      type: String,
      minLength: 3,
      maxLength: 25,
      trim: true,
      validate(value) {
        if (!validator.isAlpha(value.replace(/\s/g, "")))
          throw new Error(
            "Numbers and Special characters are not allowed in last name!",
          );
      },
    },
    emailId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value))
          throw new Error("Not a valid email, Please enter calid email ID!");
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          return validator.isStrongPassword(value);
        },
        message: "Password isn't strong",
      },
    },
    age: {
      type: Number,
      min: 15,
      max: 50,
      validate(value) {
        if (!Number.isInteger(value)) throw new Error("Enter a valid age!");
      },
    },
    gender: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return ["male", "female", "others"].includes(value);
        },
        message: (props) =>
          `${props.value} is not a valid gender, provide a valid gender!`,
      },
    },
    description: {
      type: String,
      default: "Hello, I enjoy using DevNetwork!!",
      trim: true,
      maxLength: 150,
    },
    photoUrl: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqehdPiDwe_KT7gCB64TEtpRKrKvDEJxp06Q&s",
      validate(value) {
        if (!validator.isURL(value))
          throw new Error("Enter a vailid photo URL!!");
      },
    },
    skills: [
      {
        type: String,
        lowercase: true,
        trim: true,
        //need to handle multiple same entries
        //production level approach - use presave hook
      },
    ],
    city: {
      type: String,
      trim: true,
      lowercase: true,
      maxLength: 25,
      minLength: 3,
      validate(value) {
        if (!validator.isAlpha(value.replace(/\s/g, "")))
          throw new Error(
            "Numbers and Special characters are not allowed in city name!",
          );
      },
    },
    state: {
      type: String,
      trim: true,
      lowercase: true,
      maxLength: 25,
      minLength: 3,
      validate(value) {
        if (!validator.isAlpha(value.replace(/\s/g, "")))
          throw new Error(
            "Numbers and Special characters are not allowed in state name!",
          );
      },
    },
    college: {
      type: String,
      trim: true,
      lowercase: true,
      maxLength: 25,
      minLength: 3,
    },
  },
  {
    timestamps: true,
  },
);

//The user specific operations that occur recurlargy can be created(called schema functions) here itself an used in api, its more modular practice
//like getting jwt , vaidating passwords, which are always unique

userSchema.methods.getJWT = async function () {
  const user = this;
  //If user is verified, then we create a jwt token using jsonwebtoken npm library
  //we send userId as token, so that when user access other pages, then cookie stores user id and doesnot show other persons page or doesnot ask again to login

  //Setting the expiresin propery and 7d as 7 days,after 7 days this jwt token expires, till that time it is stored in client/users browser cookies
  const token = jwt.sign({ _id: user._id }, process.env.JWT_Private_Key, {
    expiresIn: "7d",
  });
  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const paswordHash = user.password;
  //once password is edncrypted and stored in db, we can never decrypt it.
  //bcrypt library provides a compare method, where we put the user entered password along with the hashed stored password, which then tells us wether the password is correct or not.
  const validate = await bcrypt.compare(passwordInputByUser, paswordHash);

  return validate;
};

const User = mongoose.model("User", userSchema);

module.exports = { User };

//Have used two different methods to write validations, both works fine and message is printed.
