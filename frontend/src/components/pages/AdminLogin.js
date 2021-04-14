import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Input } from "antd";
import { ACCOUNT_TYPE } from "utils/consts";
import {
  login,
  logout,
  isUserAdmin,
  isUserMentee,
  isUserMentor,
} from "utils/auth.service";
import MenteeButton from "../MenteeButton";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "../css/AdminLogin.scss";

function AdminLogin() {
  const history = useHistory();
  const location = useLocation();
  const [loginProps, setLoginProps] = useState({});
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);
  const [error, setError] = useState(false);
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
          {error && (
            <div className="login-error">
              Incorrect username and/or password. Please try again.
            </div>
          )}
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
                const res = await login(email, password);
                setError(!Boolean(res));
                if (res && res.success) {
                  let loginFunction;
                  switch (loginProps.type) {
                    case ACCOUNT_TYPE.MENTEE:
                      loginFunction = isUserMentee;
                      break;
                    case ACCOUNT_TYPE.MENTOR:
                      loginFunction = isUserMentor;
                      break;
                    case ACCOUNT_TYPE.ADMIN:
                      loginFunction = isUserAdmin;
                      break;
                    default:
                      loginFunction = isUserMentor;
                      break;
                  }

                  if (await loginFunction()) {
                    history.push("/account-data");
                  } else {
                    setError(true);
                    await logout();
                  }
                }
                setLoggingIn(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
