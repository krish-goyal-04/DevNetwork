const mongoose = require("mongoose");
const validator = require("validator"); //Using this validator npm lirary to check and sanitize data before pushing into database.

const { Schema } = mongoose;

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
      require: true,
      trim: true,
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

const User = mongoose.model("User", userSchema);

module.exports = { User };

//Have used two different methods to writ validations, both works fine and message is printed.
