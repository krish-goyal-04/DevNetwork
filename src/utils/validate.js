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

module.exports = { validateSignupUser, validateLoginUSer };
