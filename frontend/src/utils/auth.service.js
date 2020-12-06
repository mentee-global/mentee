import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000",
});

// Role is where you put "admin" or "mentor"- right now
// we only have mentor
const register = (email, password, role) => {
  return instance
    .post("/register", {
      email,
      password,
      role,
    })
    .then((response) => {
      if (response.data.result && response.data.result.token) {
        localStorage.setItem(
          "registration",
          JSON.stringify(response.data.result)
        );
      }

      return response.data;
    })
    .catch((err) => {
      console.error(err);
      return false;
    });
};

const verify = (pin) => {
  return instance
    .post(
      "/verifyEmail",
      {
        pin,
      },
      { headers: { token: getCurrentRegistration()["token"] } }
    )
    .then((response) => {
      return response.data.status == 200;
    });
};

const resendVerify = () => {
  return instance.post("resendVerificationEmail", null, {
    headers: { token: getCurrentRegistration()["token"] },
  });
};

const login = (email, password) => {
  return instance
    .post("/login", {
      email,
      password,
    })
    .then((response) => {
      if (response.data.result && response.data.result.token) {
        localStorage.setItem("user", JSON.stringify(response.data.result));
      }

      return response.data;
    })
    .catch((err) => {
      console.error(err);
      return false;
    });
};

const logout = () => {
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const getMentorID = () => {
  if (isLoggedIn()) {
    return getCurrentUser()["mentorId"];
  } else return false;
};

const isLoggedIn = () => {
  return Boolean(getCurrentUser());
};

const getCurrentRegistration = () => {
  return JSON.parse(localStorage.getItem("registration"));
};

// For when the user finishes creating profile
const removeRegistration = (mentorId) => {
  const registration = JSON.parse(localStorage.getItem("registration"));
  registration["mentorId"] = mentorId;
  localStorage.removeItem("registration");
  localStorage.setItem("user", JSON.stringify(registration));
};

export {
  register,
  login,
  logout,
  getMentorID,
  isLoggedIn,
  getCurrentRegistration,
  removeRegistration,
  verify,
  resendVerify,
};
