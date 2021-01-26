import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Input, Button } from "antd";
import {
  isLoggedIn,
  getRegistrationStage,
  resendVerify,
  verify,
} from "utils/auth.service";
import MenteeButton from "../MenteeButton";
import { REGISTRATION_STAGE } from "utils/consts";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";
import Honeycomb from "../../resources/honeycomb.png";

function Verify({ history }) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      history.push("/appointments");
    }
    const registrationStage = getRegistrationStage();
    if (registrationStage === REGISTRATION_STAGE.PROFILE_CREATION) {
      history.push("/create-profile");
    } else if (registrationStage === REGISTRATION_STAGE.START) {
      history.push("/register");
    }
  }, [history]);

  return (
    <div className="home-background">
      <div className="login-content">
        <div className="verify-container">
          <div className="verify-header-container">
            <div className="verify-header-text">
              <h1 className="login-text">Account Verification</h1>
              {error && (
                <div className="register-error">Error, please try again!</div>
              )}
              {resent && <div> Email resent! </div>}
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
              disabled={verifying}
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
              loading={verifying}
              onClick={async () => {
                setVerifying(true);
                const success = await verify(code);
                if (success) {
                  history.push("/create-profile");
                } else {
                  setError(true);
                  setResent(false);
                  setVerifying(false);
                }
              }}
            />
          </div>
          <div className="login-register-container">
            Didn&#39;t receive a code?
            <Button
              type="link"
              className="verify-resend-link"
              onClick={async () => {
                // TODO: error handling for resend?
                await resendVerify();
                setResent(true);
              }}
            >
              <u>Resend</u>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(Verify);
