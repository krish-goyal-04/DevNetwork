const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 25,
      trim: true,
    },
    lastName: {
      type: String,
      minLength: 3,
      maxLength: 25,
      trim: true,
    },
    emailId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter valid email id!"],
    },
    password: String,
    age: {
      type: Number,
      min: 15,
      max: 50,
    },
    gender: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: function (value) {
          return ["Male", "Female", "Others"].includes(value);
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
    },
    skills: [
      {
        type: String,
        lowercase: true,
        trim: true,
        //need to handle multiple same entries
      },
    ],
    city: {
      type: String,
      trim: true,
      lowercase: true,
      maxLength: 25,
      minLength: 3,
    },
    state: {
      type: String,
      trim: true,
      lowercase: true,
      maxLength: 25,
      minLength: 3,
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
