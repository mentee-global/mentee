import React, { useCallback, useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { NavLink, useHistory } from "react-router-dom";
import { Input } from "antd";
import { isLoggedIn, login } from "utils/auth.service";
import MenteeButton from "../MenteeButton";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "../css/Home.scss";
import "../css/Login.scss";
import Logo from "../../resources/logo.png";

function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);
  const [error, setError] = useState(false);
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
              onClick={async () => {
                setLoggingIn(true);
                const res = await login(email, password);
                setError(!Boolean(res));
                if (Boolean(res)) {
                  redirectToAppointments();
                }
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
