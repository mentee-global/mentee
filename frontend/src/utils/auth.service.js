import axios from "axios";
import fireauth from "./fireauth";
import { AUTH_URL, REGISTRATION_STAGE, ACCOUNT_TYPE } from "utils/consts";
import i18n from "./i18n";

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
    .catch((err) => {
      console.error(err);
      return err?.response;
    });

const getIdToken = (forceRefresh) => getCurrentUser().getIdToken(forceRefresh);
export const getIdTokenResult = (forceRefresh) =>
  getCurrentUser().getIdTokenResult(forceRefresh);

// Role is where you put "admin" or "mentor"- right now we only support mentor
export const register = async (email, password, role) =>
  await post("/register", {
    email: email && email.trim(),
    password: password && password.trim(),
    role,
  }).then(async (data) => {
    if (data && data.success) {
      const result = data.result;
      await fireauth
        .auth()
        .signInWithCustomToken(result.token)
        .then((userCredential) => {})
        .catch((error) => {});
    }

    return data;
  });
export const newRegister = async (data) =>
  await post("/newRegister", data).then(async (data) => {
    if (data && data.success) {
      const result = data.result;
      await fireauth
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
    preferred_language: i18n.language,
  });
};

export const sendPasswordResetEmail = (email) => {
  return post("/forgotPassword", { email, preferred_language: i18n.language });
};

export const login = async (email, password, role) =>
  await post("/login", {
    email: email && email.trim(),
    password: password && password.trim(),
    role: String(role) && String(role).trim(),
  }).then(async (data) => {
    if (data && data.success && data.result.token) {
      localStorage.setItem("role", role);
      await fireauth
        .auth()
        .signInWithCustomToken(data.result.token)
        .catch((error) => {});

      await getIdToken().then((idToken) => {
        localStorage.setItem("userIdToken", idToken);
        return idToken;
      });
    }

    return data;
  });

export const logout = async () => {
  localStorage.removeItem("userIdToken");
  localStorage.removeItem("role");
  localStorage.removeItem("profileId");
  await fireauth
    .auth()
    .signOut()
    .catch((error) => {
      const message = error.message;

      console.error(message);
      return false;
    });
};

export const refreshToken = async () => {
  // need initial token from registration
  if (isLoggedIn()) {
    return await getCurrentUser()
      .getIdToken(true)
      .then(async (idToken) => {
        const token = await post("/refreshToken", {
          token: idToken,
          role: getRole(),
        }).then((data) => data && data.result.token);

        await fireauth.auth().signInWithCustomToken(token);

        return token;
      });
  }
};

export const getCurrentUser = () => {
  return fireauth.auth().currentUser;
};

export const isUserAdmin = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) =>
        parseInt(idTokenResult.claims.role) === ACCOUNT_TYPE.ADMIN
    );
  } else return false;
};

export const isUserMentor = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) =>
        parseInt(idTokenResult.claims.role) === ACCOUNT_TYPE.MENTOR
    );
  } else return false;
};

export const isUserMentee = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) =>
        parseInt(idTokenResult.claims.role) === ACCOUNT_TYPE.MENTEE
    );
  } else return false;
};
export const isUserPartner = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then(
      (idTokenResult) =>
        parseInt(idTokenResult.claims.role) === ACCOUNT_TYPE.PARTNER
    );
  } else return false;
};

export const getRole = () => {
  return localStorage.getItem("role");
};

export const getProfileId = () => {
  return localStorage.getItem("profileId");
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

export const getUserIdToken = () => {
  return localStorage.getItem("userIdToken");
};

export const getRegistrationStage = async () => {
  if (isLoggedIn()) {
    return await getIdTokenResult().then((idTokenResult) => {
      const claims = idTokenResult.claims;

      if (!claims.email_verified) return REGISTRATION_STAGE.VERIFY_EMAIL;
      return null;
    });
  }

  return REGISTRATION_STAGE.START;
};
