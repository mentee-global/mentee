import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000",
});

const register = (email, password) => {
  return instance
    .post("/register", {
      email,
      password,
    })
    .then((response) => {
      if (response.data.result && response.data.result.token) {
        localStorage.setItem(
          "registration",
          JSON.stringify(response.data.result)
        );
      }

      return response.data;
    });
};

const verify = (pin) => {
  return instance
    .post("/verify", {
      pin
    })
}

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

// For when the user verifies and has an actual login
const removeRegistration = () => {
  localStorage.removeItem("registration");
};

export {
  register,
  login,
  logout,
  getMentorID,
  isLoggedIn,
  getCurrentRegistration,
  removeRegistration,
};
