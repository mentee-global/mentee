import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000",
});

const register = (email, password) => {
  return instance.post("/register", {
    email,
    password,
  });
};

const login = (email, password) => {
  return instance
    .post("/login", {
      email,
      password,
    })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
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

export default {
  register,
  login,
  logout,
  getCurrentUser,
};
