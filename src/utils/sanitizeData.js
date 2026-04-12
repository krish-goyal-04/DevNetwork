const sanitizedUserData = (user) => {
  if (!user) return null;
  const { _id, age, emailId, firstName, lastName, gender, city } = user;
  return {
    _id,
    age,
    emailId,
    firstName,
    lastName,
    gender,
    city,
  };
};

module.exports = { sanitizedUserData };
