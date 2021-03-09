import axios from "axios";
import firebase from "firebase";
import { AUTH_URL, REGISTRATION_STAGE } from "utils/consts";

const instance = axios.create({
  baseURL: AUTH_URL,
});

const get = (url, params) =>
  instance
    .get(url, params)
    .then((res) => res.data)
    .catch((err) => console.error(err));

const post = (url, data, params) =>
  instance
    .post(url, data, params)
    .then((res) => res.data)
    .catch((err) => console.error(err));

// Role is where you put "admin" or "mentor"- right now we only support mentor
export const register = (email, password, role) =>
  post("/register", { email, password, role }).then((data) => {
    if (data.success) {
      const result = data.result.token;
      firebase
        .auth()
        .signInWithCustomToken(result.token)
        .then((userCredential) => {})
        .catch((error) => {});
    }

    return data;
  });

// Sends verification code to email
export const verify = (email) => {
  return post("/verifyEmail", {
    email,
  }).then((response) => {
    if (response.success) {
      // add notice that email was sent
    }
    return false;
  });
};

export const login = (email, password) =>
  post("/login", { email, password }).then((data) => {
    if (data.success) {
      firebase
        .auth()
        .signInWithCustomToken(data.result.token)
        .then((userCredential) => {
          console.log("user", userCredential);
        })
        .catch((error) => {});
    }

    return data;
  });

export const logout = () => {
  firebase
    .auth()
    .signOut()
    .catch((error) => {
      const code = error.code;
      const message = error.message;

      console.error(message);
      return false;
    });
};

// User obj is created on login & successful registration (profile creation included)
// stores mentor ID, user ID, token
export const getCurrentUser = () => {
  return firebase.auth().currentUser;
};

export const getMentorID = async () => {
  if (isLoggedIn()) {
    return await getCurrentUser()
      .getIdTokenResult()
      .then((idTokenResult) => {
        console.log("idtoken", idTokenResult);
        return idTokenResult.claims.mentorId;
      });
  } else return false;
};

export const isLoggedIn = () => {
  return Boolean(getCurrentUser());
};

export const getUserId = async () => {
  if (isLoggedIn()) {
    return await getCurrentUser()
      .getIdTokenResult()
      .then((idTokenResult) => {
        return idTokenResult.claims.userId;
      });
  }
};

export const isUserVerified = async () => {
  if (isLoggedIn()) {
    return await getCurrentUser()
      .getIdTokenResult()
      .then((idTokenResult) => {
        return idTokenResult.claims.email_verified;
      });
  }
};

export const getRegistrationStage = async () => {
  return await getCurrentUser()
    .getIdTokenResult()
    .then((idTokenResult) => {
      const claims = idTokenResult.claims;

      if (!claims.mentorId) return REGISTRATION_STAGE.START;
      if (!claims.email_verified) return REGISTRATION_STAGE.VERIFY_EMAIL;
      return REGISTRATION_STAGE.PROFILE_CREATION;
    });
};
