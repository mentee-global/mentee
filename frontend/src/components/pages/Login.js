import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Input } from "antd";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/Login.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputFocus, setInputFocus] = useState([false, false]);

  function handleInputFocus(index) {
    let newClickedInput = [false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }

  return (
    <div className="home-background">
      <div className="login-content">
        <div className="login-container">
          <h1 className="login-text">Sign In</h1>
          <div
            className={`login-input-container${
              inputFocus[0] ? "__clicked" : ""
            }`}
          >
            <Input
              className="login-input"
              onFocus={() => handleInputFocus(0)}
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
            <Input
              className="login-input"
              onFocus={() => handleInputFocus(1)}
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
              onClick={() => {}}
            />
          </div>
          <div className="login-register-container">
            <div>Don&#39;t have an account?</div>
            <NavLink to="/register" className="login-register-link">
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
