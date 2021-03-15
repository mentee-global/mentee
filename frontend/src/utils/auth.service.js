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

const getIdToken = () => getCurrentUser().getIdToken(true);
const getIdTokenResult = () => getCurrentUser().getIdTokenResult(true);

// Role is where you put "admin" or "mentor"- right now we only support mentor
export const register = (email, password, role) =>
  post("/register", { email, password, role }).then((data) => {
    if (data && data.success) {
      const result = data.result;
      firebase
        .auth()
        .signInWithCustomToken(result.token)
        .then((userCredential) => {})
        .catch((error) => {});
    }

    return data;
  });

// Sends verification code to email
export const sendVerificationEmail = (email) => {
  return post("/verifyEmail", {
    email,
  }).then((response) => {
    if (response.success) {
      // add notice that email was sent
    }
  });
};

export const login = (email, password) =>
  post("/login", { email, password }).then((data) => {
    if (data && data.success) {
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

export const refreshToken = async () => {
  if (isLoggedIn()) {
    await getIdToken().then(async (idToken) => {
      const token = await post("/refreshToken", { token: idToken }).then(
        (data) => data && data.result.token
      );
      firebase.auth().signInWithCustomToken(token);
    });
  }
};

export const getCurrentUser = () => {
  return firebase.auth().currentUser;
};

export const getMentorID = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.mentorId;
    });
  } else return false;
};

export const isLoggedIn = () => {
  return Boolean(getCurrentUser());
};

export const getUserId = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.userId;
    });
  }
};

export const isUserVerified = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.email_verified;
    });
  }
};

export const getUserEmail = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.email;
    });
  }
};

export const getRegistrationStage = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      const claims = idTokenResult.claims;

      if (!claims.email_verified) return REGISTRATION_STAGE.VERIFY_EMAIL;
      if (!claims.mentorId) return REGISTRATION_STAGE.PROFILE_CREATION;
      return null;
    });
  }

  return REGISTRATION_STAGE.START;
};
