import React, { useState, useEffect } from "react";
import { useHistory, useLocation, NavLink } from "react-router-dom";
import { Input } from "antd";
import { LOGIN_ERROR_MSGS } from "utils/consts";
import { login, sendVerificationEmail } from "utils/auth.service";
import MenteeButton from "../MenteeButton";
import firebase from "firebase";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "../css/Login.scss";

function Login() {
  const history = useHistory();
  const location = useLocation();
  const [loginProps, setLoginProps] = useState({});
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    LOGIN_ERROR_MSGS.INCORRECT_NAME_PASSWORD_ERROR_MSG
  );
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!location.state) {
      history.push({
        pathname: "/select-login",
      });
      // Redirects since login state has not be set for login yet
    }
    setLoginProps(location.state);
  }, [location]);

  function handleInputFocus(index) {
    let newClickedInput = [false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }
  return (
    <div className="page-background">
      <div className="login-content">
        <div className="login-container">
          <h1 className="login-text">
            Sign In as {loginProps && loginProps.title}
          </h1>
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
              // use this to connect auth
              onClick={async () => {
                setLoggingIn(true);
                const res = await login(email, password, loginProps.login);

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
                      history.push(loginProps.redirect);
                    }
                  });

                setLoggingIn(false);
              }}
            />
          </div>
          <div className="register-link">
            Don't Have an account?{" "}
            <NavLink to="/register" className="login-register-link">
              Register
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
