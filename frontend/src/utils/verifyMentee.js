import { getIsEmailVerified } from "./api";

const verify = async (email, password, isMentor) => {
  const res = await getIsEmailVerified(email, password);
  // This prevents only using a mentor's email
  // Which doesn't require a password to view gallery
  if (!isMentor && res.is_mentor) {
    return false;
  }

  return res.is_verified;
};

export { verify };
