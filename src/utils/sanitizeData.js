const sanitizedUserData = (user) => {
  if (!user) return null;

  const {
    _id,
    age,
    emailId,
    firstName,
    lastName,
    skills,
    state,
    college,
    gender,
    city,
    photoUrl,
    description,
  } = user;
  return {
    _id,
    age,
    emailId,
    firstName,
    lastName,
    skills,
    state,
    college,
    gender,
    city,
    photoUrl,
    description,
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
