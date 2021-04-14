import React, { useCallback, useState, useEffect } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { Input } from "antd";
import {
  isLoggedIn,
  login,
  isUserAdmin,
  logout,
  sendVerificationEmail,
} from "utils/auth.service";
import MenteeButton from "../MenteeButton";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { ACCOUNT_TYPE, LOGIN_ERROR_MSGS } from "utils/consts";
import useAuth from "utils/hooks/useAuth";
import "../css/AdminLogin.scss";

function AdminLogin(props) {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    LOGIN_ERROR_MSGS.INCORRECT_NAME_PASSWORD_ERROR_MSG
  );
  const [loggingIn, setLoggingIn] = useState(false);
  const history = useHistory();
  const { onAuthStateChanged } = useAuth();

  function handleInputFocus(index) {
    let newClickedInput = [false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }
  return (
    <div className="page-background">
      <div className="login-content">
        <div className="login-container">
          <h1 className="login-text">Sign In as an Administrator</h1>
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
                const res = await login(email, password, ACCOUNT_TYPE.ADMIN);

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

                onAuthStateChanged(async (user) => {
                  if (!user) return;

                  history.push("/account-data");
                });

                setLoggingIn(false);
              }}
            />
          </div>
          <div className="login-register-container">
            <div>Don&#39;t have an account?</div>
            <NavLink
              to={`/register?as=${ACCOUNT_TYPE.ADMIN}`}
              className="login-register-link"
            >
              Register
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
