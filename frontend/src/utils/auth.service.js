import axios from "axios";
import firebase from "firebase";
import { AUTH_URL, REGISTRATION_STAGE, ACCOUNT_TYPE } from "utils/consts";
import { useAuth } from "utils/hooks/useAuth";

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
export const getIdTokenResult = () => getCurrentUser().getIdTokenResult(true);

// Role is where you put "admin" or "mentor"- right now we only support mentor
export const register = async (email, password, role) =>
  await post("/register", {
    email: email && email.trim(),
    password: password && password.trim(),
    role,
  }).then(async (data) => {
    if (data && data.success) {
      const result = data.result;
      await firebase
        .auth()
        .signInWithCustomToken(result.token)
        .then((userCredential) => {})
        .catch((error) => {});
    }

    return data;
  });

export const sendVerificationEmail = (email) => {
  return post("/verifyEmail", {
    email,
  });
};

export const sendPasswordResetEmail = (email) => {
  return post("/forgotPassword", { email });
};

export const login = async (email, password) =>
  await post("/login", {
    email: email && email.trim(),
    password: password && password.trim(),
  }).then(async (data) => {
    if (data && data.success && data.result.token) {
      await firebase
        .auth()
        .signInWithCustomToken(data.result.token)
        .catch((error) => {});
    }

    return data;
  });

export const logout = async () =>
  await firebase
    .auth()
    .signOut()
    .catch((error) => {
      const code = error.code;
      const message = error.message;

      console.error(message);
      return false;
    });

export const refreshToken = async () => {
  // need initial token from registration
  if (isLoggedIn()) {
    return await getIdToken().then(async (idToken) => {
      const token = await post("/refreshToken", { token: idToken }).then(
        (data) => data && data.result.token
      );

      await firebase.auth().signInWithCustomToken(token);

      return token;
    });
  }
};

export const getCurrentUser = () => {
  return firebase.auth().currentUser;
};

export const isUserAdmin = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) => idTokenResult.claims.role === ACCOUNT_TYPE.ADMIN
    );
  } else return false;
};

export const isUserMentor = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) => idTokenResult.claims.role === ACCOUNT_TYPE.MENTOR
    );
  } else return false;
};

export const isUserMentee = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) => idTokenResult.claims.role === ACCOUNT_TYPE.MENTEE
    );
  } else return false;
};

export const getRole = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) => idTokenResult.claims.role
    );
  } else return null;
};

export const getMentorID = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.mentorId;
    });
  } else return false;
};

export const getMenteeID = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.menteeId;
    });
  } else return false;
};

export const getAdminID = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.adminId;
    });
  } else return false;
};

export const isLoggedIn = () => {
  return Boolean(getCurrentUser());
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

export const getUserIdToken = async () => {
  if (isLoggedIn()) {
    return await getIdToken().then((idToken) => {
      return idToken;
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
