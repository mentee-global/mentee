import { getIsEmailVerified } from "./api";

console.log(window.name);

const verify = async (email, password) => {
  const res = await getIsEmailVerified(email, password);

  if (res.is_verified) {
    window.name = "True";
    return true;
  }

  return false;
};

const isVerified = () => {
  return window.name === "True";
};

export { isVerified, verify };
