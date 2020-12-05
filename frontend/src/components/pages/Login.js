import React, { useState, useEffect } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { Input } from "antd";
import { isLoggedIn, login } from "utils/auth.service";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/Login.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputClicked, setInputClicked] = useState([false, false]);
  const [error, setError] = useState(false);
  const history = useHistory();

  const redirectToAppointments = () => {
    history.push("appointments");
  };

  useEffect(() => {
    if (isLoggedIn()) {
      redirectToAppointments();
    }
  }, []);

  const handleInputClick = (index) => {
    let newClickedInput = [false, false];
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  };
  return (
    <div className="home-background">
      <div className="login-content">
        <div className="login-container">
          <h1 className="login-text">Sign In</h1>
          {error && (
            <p>Incorrect username and/or password. Please try again.</p>
          )}
          <div
            className={`login-input-container${
              inputClicked[0] ? "__clicked" : ""
            }`}
          >
            <Input
              className="login-input"
              onClick={() => handleInputClick(0)}
              onChange={(e) => setEmail(e.target.value)}
              bordered={false}
              placeholder="Email"
            />
          </div>
          <div
            className={`login-input-container${
              inputClicked[1] ? "__clicked" : ""
            }`}
          >
            <Input
              className="login-input"
              onClick={() => handleInputClick(1)}
              onChange={(e) => setPassword(e.target.value)}
              bordered={false}
              placeholder="Password"
            />
          </div>
          <div className="login-button">
            <MenteeButton
              content={<b>Login</b>}
              width={"50%"}
              height={"125%"}
              onClick={async () => {
                const res = await login(email, password);
                setError(!Boolean(res));
                if (!error) {
                  redirectToAppointments();
                }
              }}
            />
          </div>
          <div className="login-register-container">
            <div>Don&#39;t have an account?</div>
            <NavLink to="/" className="login-register-link">
              Register
            </NavLink>
          </div>
        </div>
        <img className="home-honeycomb" src={Honeycomb} alt="" />
      </div>
    </div>
  );
}

export default Login;
