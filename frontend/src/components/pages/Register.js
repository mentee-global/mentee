import React, { useState } from "react";
import { NavLink, useHistory, withRouter } from "react-router-dom";
import { Input } from "antd";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [inputFocus, setInputFocus] = useState([false, false, false]);
  const history = useHistory();

  function handleInputFocus(index) {
    let newClickedInput = [false, false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }

  const setErrors = () => {
    let newPasswordError = password !== confirmPassword;
    let newFieldError =
      email === "" || password === "" || confirmPassword === "";
    if (newPasswordError || newFieldError) {
      setPasswordError(newPasswordError);
      setFieldError(newFieldError);
    } else {
      history.push("/verify");
    }
  };

  return (
    <div className="home-background">
      <div className="login-content">
        <div className="register-container">
          <h1 className="login-text">Register</h1>
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
          <div
            className={`login-input-container${
              inputFocus[2] ? "__clicked" : ""
            }`}
          >
            <Input
              className="login-input"
              onFocus={() => handleInputFocus(2)}
              onChange={(e) => setConfirmPassword(e.target.value)}
              bordered={false}
              placeholder="Confirm Password"
            />
          </div>
          {fieldError ? (
            <div className="register-error">All fields must be set</div>
          ) : passwordError ? (
            <div className="register-error">Passwords do not match</div>
          ) : (
            <br />
          )}
          <div className="login-button">
            <MenteeButton
              content={<b>Next</b>}
              width={"50%"}
              height={"125%"}
              onClick={setErrors}
            />
          </div>
          <div className="login-register-container">
            <div>Already have an account?</div>
            <NavLink to="/register-form" className="login-register-link">
              Login
            </NavLink>
          </div>
        </div>
        <img className="home-honeycomb" src={Honeycomb} alt="" />
      </div>
    </div>
  );
}

export default withRouter(Register);
