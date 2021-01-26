import axios from "axios";
import { AUTH_URL, REGISTRATION_STAGE } from "utils/consts";

const instance = axios.create({
  baseURL: AUTH_URL,
});

// Role is where you put "admin" or "mentor"- right now we only support mentor
const register = (email, password, role) => {
  return instance
    .post("/register", {
      email,
      password,
      role,
    })
    .then((response) => {
      if (response.data.result && response.data.result.token) {
        response.data.result.verified = false;
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

// Sends verification code to email
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
      if (response.data.status === 200) {
        const registration = JSON.parse(localStorage.getItem("registration"));
        registration["verified"] = true;
        localStorage.setItem("registration", JSON.stringify(registration));
        return true;
      }
      return false;
    })
    .catch((err) => {
      console.error(err);
      return false;
    });
};

// Resends verification code to email they registered with
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

// User obj is created on login & successful registration (profile creation included)
// stores mentor ID, user ID, token
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

// Registration obj is created on registration (inputting email, password)
// and deleted on successful profile creation
// stores user ID, token
const getCurrentRegistration = () => {
  return JSON.parse(localStorage.getItem("registration"));
};

const getRegistrationStage = () => {
  const registration = getCurrentRegistration();

  if (!registration) return REGISTRATION_STAGE.START;
  if (!registration.verified) return REGISTRATION_STAGE.VERIFY_EMAIL;
  return REGISTRATION_STAGE.PROFILE_CREATION;
};

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
  getRegistrationStage,
  removeRegistration,
  verify,
  resendVerify,
};
