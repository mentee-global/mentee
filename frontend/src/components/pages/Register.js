import React, { useEffect, useState } from "react";
import { NavLink, withRouter } from "react-router-dom";
import { Input } from "antd";
import MenteeVerificationModal from "../MenteeVerificationModal";
import {
  getRegistrationStage,
  isLoggedIn,
  register,
  sendVerificationEmail,
  refreshToken,
} from "utils/auth.service";
import { REGISTRATION_STAGE } from "utils/consts";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";
import Logo from "../../resources/logo.png";

function Register({ history }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inputFocus, setInputFocus] = useState([false, false, false]);

  useEffect(() => {
    async function fetchData() {
      const registrationStage = await getRegistrationStage();
      console.log("regstate", registrationStage);

      if (registrationStage === null) {
        history.push("/appointments");
      } else if (registrationStage === REGISTRATION_STAGE.PROFILE_CREATION) {
        history.push("/create-profile");
      } else if (registrationStage === REGISTRATION_STAGE.VERIFY_EMAIL) {
        history.push("/verify");
      }
    }

    fetchData();
  }, [history]);

  function handleInputFocus(index) {
    let newClickedInput = [false, false, false];
    newClickedInput[index] = true;
    setInputFocus(newClickedInput);
  }

  const checkErrors = () => {
    let newPasswordError = password !== confirmPassword;
    let newFieldError =
      email === "" || password === "" || confirmPassword === "";
    if (newPasswordError || newFieldError) {
      setPasswordError(newPasswordError);
      setFieldError(newFieldError);
      return true;
    }
    return false;
  };

  const submitForm = async () => {
    setSaving(true);
    if (!checkErrors()) {
      const res = await register(email, password, "mentor");
      if (res.success) {
        // send verification email
        const res = await sendVerificationEmail(email);

        history.push(`/verify?sent=${res.success}`);
      } else {
        setServerError(true);
      }
    }
    setSaving(false);
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
              disabled={saving}
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
            <Input.Password
              className="login-input"
              disabled={saving}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
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
            <Input.Password
              className="login-input"
              disabled={saving}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
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
          ) : serverError ? (
            <div className="register-error">Error, please try again!</div>
          ) : (
            <br />
          )}
          <MenteeVerificationModal
            content={<b>Next</b>}
            width="50%"
            height="125%"
            loading={saving}
            onVerified={submitForm}
            className="login-button"
            mentor
          />
          <div className="login-register-container">
            <div>Already have an account?</div>
            <NavLink to="/login" className="login-register-link">
              Login
            </NavLink>
          </div>
        </div>
        <img className="logo" src={Logo} alt="" />
      </div>
    </div>
  );
}

export default withRouter(Register);
