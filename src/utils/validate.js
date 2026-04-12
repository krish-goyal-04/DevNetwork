const validator = require("validator");
const { User } = require("../models/user");

const validateSignupUser = async (req, res, next) => {
  try {
    const { firstName, emailId, password } = req.body;

    //If 'return' is not sent along with response in case of error then even after sending response
    // the code keeps on running.
    if (!firstName || !password || !emailId)
      return res.status(400).json({ message: "Enter all credentials !!" });

    const doesUserExists = await User.exists({ emailId });
    //unique;true handles this this works as an additional check
    if (doesUserExists != null) {
      return res.status(409).json({ message: "User already exists !!" });
    }

    //Error status 409 tells the current data requested conflicts with the data with server

    //These validations can also be done on Schema level(ie while designing schema) and here as well. vice versa
    if (!validator.isStrongPassword(password))
      return res.status(400).json({ message: "Enter a strong password!!!" });

    next();
  } catch (err) {
    //error 500 eror tells that the server encounters an unexpected error, to handle those we use 500 code
    return res.status(500).json({ message: err.message });
  }
};

const validateLoginUSer = async (req, res, next) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password)
      return res.status(400).json({ message: "Enter all credentials !!" });
    if (!validator.isEmail(emailId))
      return res.status(400).json({ message: "Enter a valid Email ID !!" });

    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
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
      return res.status(400).json({ message: "Invalid update request !!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  validateSignupUser,
  validateLoginUSer,
  validateProfileEditData,
};
