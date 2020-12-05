import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Input } from "antd";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Register() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [inputClicked, setInputClicked] = useState([
    false,
    false,
    false,
    false,
  ]);

  function handleInputClick(index) {
    let newClickedInput = [false, false, false, false];
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  const setErrors = () => {
    setPasswordError(password !== confirmPassword);
    setFieldError(
      email === "" || phone === "" || password === "" || confirmPassword === ""
    );
  };

  return (
    <div className="home-background">
      <div className="login-content">
        <div className="register-container">
          <h1 className="login-text">Register</h1>
          <div
            className={`login-input-container${inputClicked[0] ? "__clicked" : ""
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
            className={`login-input-container${inputClicked[1] ? "__clicked" : ""
              }`}
          >
            <Input
              className="login-input"
              onClick={() => handleInputClick(1)}
              onChange={(e) => setPhone(e.target.value)}
              bordered={false}
              placeholder="Phone #"
            />
          </div>
          <div
            className={`login-input-container${inputClicked[2] ? "__clicked" : ""
              }`}
          >
            <Input
              className="login-input"
              onClick={() => handleInputClick(2)}
              onChange={(e) => setPassword(e.target.value)}
              bordered={false}
              placeholder="Password"
            />
          </div>
          <div
            className={`login-input-container${inputClicked[3] ? "__clicked" : ""
              }`}
          >
            <Input
              className="login-input"
              onClick={() => handleInputClick(3)}
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
              onClick={() => setErrors()}
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

export default Register;
