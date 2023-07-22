import React, { useState, useEffect } from "react";
import { useHistory, useLocation, NavLink } from "react-router-dom";
import { Input } from "antd";
import fireauth from "utils/fireauth";
import { useDispatch } from "react-redux";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import {
  isLoggedIn,
  login,
  sendVerificationEmail,
  logout,
} from "utils/auth.service";
import { fetchUser, resetUser } from "features/userSlice";
import usePersistedState from "utils/hooks/usePersistedState";
import SelectLogin from "./SelectLogin";
import "../css/Login.scss";
import { useTranslation, Trans } from "react-i18next";
import loginimg from "resources/login.png";
import { useAuth } from "utils/hooks/useAuth";

const Logins = Object.freeze({
  mentee: {
    title: "Mentee",
    type: ACCOUNT_TYPE.MENTEE,
    redirect: "/mentee-appointments",
  },
  mentor: {
    title: "Mentor",
    type: ACCOUNT_TYPE.MENTOR,
    redirect: "/appointments",
  },
  partner: {
    title: "Partner",
    type: ACCOUNT_TYPE.PARTNER,
    redirect: "/partner-page",
  },
  admin: {
    title: "Admin",
    type: ACCOUNT_TYPE.ADMIN,
    redirect: "/account-data",
  },
  guest: {
    title: "Guest",
    type: ACCOUNT_TYPE.GUEST,
    redirect: "/gallery",
  },
});
const getRoleObject = (key) => {
  return { ...Logins[key] };
};

function GuestLogin() {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);
  const [error, setError] = useState(false);
  const [displaySelect, setDisplaySelect] = useState(false);
  const [roleObject, setroleObject] = useState({});
  const [errorMessage, setErrorMessage] = useState(
    t("loginErrors.incorrectCredentials")
  );
  const [loggingIn, setLoggingIn] = useState(false);
  const [permissions, setPermissions] = usePersistedState(
    "permissions",
    ACCOUNT_TYPE.ADMIN
  );
  const { resetRoleState } = useAuth();

  const logoutUser = () => {
    logout().then(() => {
      resetRoleState();
      dispatch(resetUser());
      history.push("/readonly");
    });
  };

  const handleDisplayImages = () => {
    setDisplaySelect(true);
  };
  const handleSelect = async (key) => {
    let RoleObj = getRoleObject(key);
    if (RoleObj) {
      setLoggingIn(true);
      setLoading(true);
      setError(false);
      const res = await login(email, password, RoleObj.type);
      setLoading(false);

      if (!res || !res.success) {
        if (res?.data?.result?.existingEmail) {
          setErrorMessage(t("loginErrors.existingEmail"));
        } else {
          setErrorMessage(t("loginErrors.incorrectCredentials"));
        }
        setError(true);
      } else if (res.result.passwordReset) {
        setErrorMessage(t("loginErrors.resetPassword"));
        setError(true);
      } else if (res.result.recreateAccount) {
        setErrorMessage(t("loginErrors.reregisterAccount"));
        setError(true);
      }
      setPermissions(RoleObj.type);
      const unsubscribe = fireauth.auth().onAuthStateChanged(async (user) => {
        unsubscribe();
        if (!user) return;

        if (res.result.redirectToVerify) {
          await sendVerificationEmail(email);
          history.push("/verify");
        } else {
          dispatch(
            fetchUser({
              id: res.result.profileId,
              role: Number(res.result.role),
            })
          );
          history.push(RoleObj.redirect);
        }
      });

      setLoggingIn(false);
      setroleObject(RoleObj);
    }
  };
  function handleInputFocus(index) {
    let newClickedInput = [false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }
  return (
    <div className="containerr">
      <h1 className="home-header3">
        <Trans i18nKey={"common.welcome"}>
          Welcome to <span>MENTEE!</span>
        </Trans>
      </h1>
      {!isLoggedIn() && (
        <>
          <div className="page-background">
            <div className="login-content">
              <h1 className="login-text">{t("common.login")}</h1>

              <div
                className={`login-input-container${
                  inputFocus[0] ? "__clicked" : ""
                }`}
              >
                <Input
                  className="login-input"
                  onFocus={() => handleInputFocus(0)}
                  disabled={loggingIn}
                  onChange={(e) => setEmail(e.target.value)}
                  bordered={false}
                  placeholder={t("common.email")}
                />
              </div>
              <div
                className={`login-input-container${
                  inputFocus[1] ? "__clicked" : ""
                }`}
              >
                <Input.Password
                  className="login-input_pass"
                  disabled={loggingIn}
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  onFocus={() => handleInputFocus(1)}
                  onChange={(e) => setPassword(e.target.value)}
                  bordered={false}
                  placeholder={t("common.password")}
                />
              </div>
            </div>
          </div>
        </>
      )}
      {error && <h1 className="login-error">{errorMessage}</h1>}
      {loading ? <h1 className="loadingg">Loading ..</h1> : ""}

      {!isLoggedIn() && (
        <SelectLogin
          displaySelect={displaySelect}
          handleDisplayImages={handleDisplayImages}
          handleSelect={handleSelect}
          isGuest={true}
        ></SelectLogin>
      )}
      {/* TODO: Translate this and loading */}
      {isLoggedIn() && (
        <div className="home-content">
          <div className="buttons-container">
            <div className="loginCon" onClick={logoutUser}>
              <img className="applyImage" src={loginimg} alt="login" />

              <div className="loginText">{t("common.logout")}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestLogin;
