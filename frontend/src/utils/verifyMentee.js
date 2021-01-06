import { getIsEmailVerified } from "./api";

const verify = async (email, password) => {
  const res = await getIsEmailVerified(email, password);

  if (res.is_verified) {
    localStorage.setItem("verification", JSON.stringify(res));
    return true;
  }

  return false;
};

const getVerification = () => {
  return JSON.parse(localStorage.getItem("verification"));
};

const isVerified = () => {
  return Boolean(getVerification());
};

export { isVerified, getVerification, verify };
