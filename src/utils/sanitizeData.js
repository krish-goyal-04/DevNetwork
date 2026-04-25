const sanitizedUserData = (user) => {
  if (!user) return null;
  const { _id, age, emailId, firstName, lastName, gender, city, photoUrl } =
    user;
  return {
    _id,
    age,
    photoUrl,
    emailId,
    firstName,
    lastName,
    gender,
    city,
  };
};

const sanitizedConnectionData = (newReq) => {
  if (!newReq) return null;
  const { _id, toUserId, fromUserId, status } = newReq;
  return {
    _id,
    toUserId,
    fromUserId,
    status,
  };
};

module.exports = { sanitizedUserData, sanitizedConnectionData };
