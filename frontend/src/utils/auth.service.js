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
    });
};

const logout = () => {
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const isLoggedIn = () => {
  return Boolean(getCurrentUser());
};

const getCurrentRegistration = () => {
  return JSON.parse(localStorage.getItem("registration"));
};

// For when the user verifies and has an actual login
const removeRegistration = () => {
  localStorage.removeItem("reigstration");
};

export {
  register,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  getCurrentRegistration,
  removeRegistration,
};
