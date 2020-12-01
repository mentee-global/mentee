import React, { useState } from "react";
import { Input } from "antd";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/SignIn.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [inputClicked, setInputClicked] = useState(new Array(2).fill(false));

  function handleInputClick(index) {
    let newClickedInput = new Array(2).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  return (
    <div className="home-background">
      <div className="signin-content">
        <div className="signin-container">
          <h1 className="signin-text">Sign In</h1>
          <div
            className={`signin-input-container${
              inputClicked[0] ? "__clicked" : ""
            }`}
          >
            <Input
              className="signin-input"
              onClick={() => handleInputClick(0)}
              onChange={(e) => setEmail(e.target.value)}
              bordered={false}
              placeholder="Email"
            />
          </div>
          <div
            className={`signin-input-container${
              inputClicked[1] ? "__clicked" : ""
            }`}
          >
            <Input
              className="signin-input"
              onClick={() => handleInputClick(1)}
              onChange={(e) => setPassword(e.target.value)}
              bordered={false}
              placeholder="Password"
            />
          </div>
          <div className="signin-button">
            <MenteeButton
              content={<b>Login</b>}
              width={"60%"}
              height={"150%"}
              onClick={() => {}}
            />
          </div>
          <div className="signin-register-container">
            <div>Don&#39;t have an account?</div>
            <button
              className="signin-register-button"
              onClick={() => console.log("clicked")}
            >
              Register
            </button>
          </div>
        </div>
        <img className="home-honeycomb" src={Honeycomb} alt="" />
      </div>
    </div>
  );
}

export default Login;
