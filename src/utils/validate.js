const validator = require("validator");
const { User } = require("../models/user");

const validateSignupUser = async (req, res) => {
  try {
    const { firstName, emailId, password } = req.body;

    if (!firstName || !password || !emailId)
      throw new Error("Enter all credentials!");

    const doesUserExists = await User.exists({ emailId });
    if (doesUserExists != null) {
      throw new Error("User already exists!");
    }

    //These validations can also be done on Schema level(ie while designing schema) and here as well. vice versa
    if (!validator.isStrongPassword(password))
      throw new Error("Enter a strong password!!!");
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
};

const validateLoginUSer = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password)
      throw new Error("Enter both email and password!");
    if (!validator.isEmail(emailId))
      throw new Error("Enter a valid email ID!!");
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
};

const validateProfileEditData = async (req, res) => {
  //We cant allow the user to update some sensitive profile related information like email(once created, it should stay always),user id,etc.
  //So we create a Allowed updates string array to only allow those fields to be updated which doesnot affect the account relevance.
  //then we check out(using every()) all those unwanted/unsecured(in term of user account management) update requests(userid,email id,etc) from request body. If even any one exists, the request will fail.

  //The every() method in JavaScript is an array method that tests whether all elements in an array satisfy a specific condition provided by a callback function.
  try {
    const allowedUpdates = [
      "firstName",
      "lastName",
      "age",
      "gender",
      "description",
      "photoUrl",
      "skills",
      "city",
      "state",
      "college",
    ];
    const isUpdateAllowed = Object.keys(req.body).every((k) =>
      allowedUpdates.includes(k),
    );

    if (!isUpdateAllowed)
      throw new Error("Invalid update requested, please try again!!!");
  } catch (err) {
    res.send("ERROR : " + err.message);
  }
};

module.exports = {
  validateSignupUser,
  validateLoginUSer,
  validateProfileEditData,
};
