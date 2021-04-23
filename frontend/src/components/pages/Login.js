import React, { useCallback, useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { NavLink, useHistory } from "react-router-dom";
import { Input } from "antd";
import {
  isLoggedIn,
  login,
  refreshToken,
  isUserAdmin,
  sendVerificationEmail,
} from "utils/auth.service";
import MenteeButton from "../MenteeButton";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import Logo from "../../resources/logo.png";
import firebase from "firebase";
import { ACCOUNT_TYPE, LOGIN_ERROR_MSGS } from "utils/consts";

import "../css/Home.scss";
import "../css/Login.scss";

function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    LOGIN_ERROR_MSGS.INCORRECT_NAME_PASSWORD_ERROR_MSG
  );
  const [loggingIn, setLoggingIn] = useState(false);
  const history = useHistory();
  const isMobile = useMediaQuery({ query: `(max-width: 768px)` });

  function handleInputFocus(index) {
    let newClickedInput = [false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }

  const redirectToAppointments = useCallback(() => {
    history.push("appointments");
  }, [history]);

  const redirectToAdminPortal = useCallback(() => {
    history.push("account-data");
  }, [history]);

  useEffect(() => {
    if (isLoggedIn()) {
      redirectToAppointments();
    }
  }, [redirectToAppointments]);

  return (
    <div className="home-background">
      <div className="login-content">
        <div className="login-container">
          <h1 className="login-text">Sign In</h1>
          {error && <div className="login-error">{errorMessage}</div>}
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
              placeholder="Email"
            />
          </div>
          <div
            className={`login-input-container${
              inputFocus[1] ? "__clicked" : ""
            }`}
          >
            <Input.Password
              className="login-input"
              disabled={loggingIn}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              onFocus={() => handleInputFocus(1)}
              onChange={(e) => setPassword(e.target.value)}
              bordered={false}
              placeholder="Password"
            />
          </div>
          <div className="login-button">
            <MenteeButton
              content={<b>Log In</b>}
              width={"50%"}
              height={"125%"}
              loading={loggingIn}
              onClick={async () => {
                setLoggingIn(true);

                const res = await login(email, password, ACCOUNT_TYPE.MENTEE);
                if (!res || !res.success) {
                  setErrorMessage(
                    LOGIN_ERROR_MSGS.INCORRECT_NAME_PASSWORD_ERROR_MSG
                  );
                  setError(true);
                } else if (res.result.passwordReset) {
                  setErrorMessage(LOGIN_ERROR_MSGS.RESET_PASSWORD_ERROR_MSG);
                  setError(true);
                } else if (res.result.recreateAccount) {
                  setErrorMessage(LOGIN_ERROR_MSGS.RECREATE_ACCOUNT_ERROR_MSG);
                  setError(true);
                }

                const unsubscribe = firebase
                  .auth()
                  .onAuthStateChanged(async (user) => {
                    unsubscribe();
                    if (!user) return;

                    if (res.result.redirectToVerify) {
                      await sendVerificationEmail(email);
                      history.push("/verify");
                    } else if (res.result.redirectToCreateProfile) {
                      history.push("/create-profile");
                    } else {
                      redirectToAppointments();
                    }
                  });

                setLoggingIn(false);
              }}
            />
          </div>
          <div className="login-register-container">
            <div>Don&#39;t have an account?</div>
            <NavLink to="/register" className="login-register-link">
              Register
            </NavLink>
          </div>
          <div className="login-register-container">
            <div>Forgot password?</div>
            <NavLink to="/forgot-password" className="login-register-link">
              Reset it
            </NavLink>
          </div>
        </div>
        {!isMobile && (
          <figure>
            {" "}
            <img className="logo" src={Logo} alt="" />{" "}
          </figure>
        )}
      </div>
    </div>
  );
}

export default Login;
