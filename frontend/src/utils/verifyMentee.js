import { getIsEmailVerified } from "./api";

const verify = async (email, password) => {
  const res = await getIsEmailVerified(email, password);

  sessionStorage.setItem("isVerified", JSON.stringify(res.is_verified));
};

const isVerified = () => {
  return Boolean(JSON.parse(sessionStorage.getItem("isVerified")));
};

export { isVerified, verify };
