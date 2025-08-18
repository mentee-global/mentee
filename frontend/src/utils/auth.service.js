import axios from "axios";
import fireauth from "./fireauth";
import { AUTH_URL, REGISTRATION_STAGE, ACCOUNT_TYPE } from "utils/consts";
import i18n from "./i18n";

const instance = axios.create({
  baseURL: AUTH_URL,
  withCredentials: true,
});

// Function to get CSRF token
const getCsrfToken = async () => {
  try {
    const response = await axios.get(
      `${AUTH_URL.replace("auth/", "api/csrf-token")}`,
      {
        withCredentials: true,
      }
    );
    return response.data.csrf_token;
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    return null;
  }
};

const get = (url, params) =>
  instance
    .get(url, params)
    .then((res) => res.data)
    .catch((err) => console.error(err));

const post = async (url, data, params) => {
  try {
    // Get CSRF token for POST requests
    const csrfToken = await getCsrfToken();
    const headers = {
      ...(params?.headers || {}),
    };

    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await instance.post(url, data, {
      ...params,
      headers,
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    console.error(err);
    return err?.response;
  }
};

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

export const login = async (email, password, role, path = undefined) =>
  await post("/login", {
    email: email && email.trim().toLowerCase(),
    password: password && password.trim(),
    role: String(role) && String(role).trim(),
    path: path,
  }).then(async (data) => {
    if (data && data.success && data.result.token) {
      localStorage.setItem("role", role);
      if (path && role == ACCOUNT_TYPE.HUB) {
        localStorage.setItem("login_path", path);
      }
      await fireauth
        .auth()
        .signInWithCustomToken(data.result.token)
        .catch((error) => {
          console.error(error);
        });
    }

    return data;
  });

export const logout = async () => {
  localStorage.removeItem("role");
  localStorage.removeItem("login_path");
  localStorage.removeItem("support_user_id");
  localStorage.removeItem("profileId");
  localStorage.removeItem("direct_path");
  await fireauth
    .auth()
    .signOut()
    .catch((error) => {
      const message = error.message;

      console.error(message);
      return false;
    });
  localStorage.removeItem("login_path");
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
export const getLoginPath = () => {
  return localStorage.getItem("login_path");
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

export const getUserEmail = () => {
  if (isLoggedIn()) {
    return getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.email;
    });
  }
};

export const getUserIdToken = async () => {
  if (isLoggedIn()) {
    return await getIdToken().then((idToken) => {
      return idToken;
    });
  } else {
    return null;
  }
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
