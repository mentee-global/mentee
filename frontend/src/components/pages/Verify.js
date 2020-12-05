import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Input, Button } from "antd";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Verify() {
  const [code, setCode] = useState("");

  return (
    <div className="home-background">
      <div className="login-content">
        <div className="verify-container">
          <div className="verify-header-container">
            <div className="verify-header-text">
              <h1 className="login-text">Account Verification</h1>
              <br />
              <t className="verify-header-text-description">
                Please type the verification code sent to your email.
              </t>
            </div>
            <div className="verify-header-image">
              <img className="verify-honeycomb" src={Honeycomb} alt="" />
            </div>
          </div>
          <div className="login-input-container__clicked">
            <Input
              className="login-input"
              onChange={(e) => setCode(e.target.value)}
              bordered={false}
              placeholder="Enter the 7-8 digit code"
            />
          </div>
          <div className="login-button">
            <MenteeButton
              content={<b>Confirm</b>}
              width={"50%"}
              height={"125%"}
              onClick={() => {}} // TODO: replace with auth confirmation
            />
          </div>
          <div className="login-register-container">
            Didn&#39;t receive a code?
            <Button
              type="link"
              className="verify-resend-link"
              onClick={() => {}} // TODO: replace with auth resend
            >
              <u>Resend</u>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Verify;
