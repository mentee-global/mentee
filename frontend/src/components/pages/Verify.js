import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import { Button } from "antd";
import {
  sendVerificationEmail,
  getUserEmail,
  isUserVerified,
  isUserMentor,
  isUserAdmin,
  isUserMentee,
  refreshToken,
  isUserPartner,
} from "utils/auth.service";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";

function Verify({ history, sent }) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [resent, setResent] = useState(false);

  return (
    <div className="home-background">
      <div className="login-content2">
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
                A verification email has been sent to your email. Please click
                the link contained inside to verify your account. <br />
                (Refresh this page if you verified your email)
              </t>
            </div>
          </div>
          <div className="verify-login-button">
            <MenteeButton
              content={<b>Confirm</b>}
              width={"50%"}
              height={"125%"}
              loading={verifying}
              onClick={async () => {
                setVerifying(true);
                await refreshToken();
                const success = await isUserVerified();
                if (success) {
                  if (await isUserMentor()) {
                    history.push(`/appointments`);
                  } else if (await isUserMentee()) {
                    history.push(`/mentee-appointment`);
                  } else if (await isUserPartner()) {
                    history.push(`/profile`);
                  } else if (await isUserAdmin()) {
                    history.push("/account-data");
                  }
                } else {
                  setError(true);
                  setResent(false);
                  setVerifying(false);
                }
              }}
            />
          </div>
          <div className="login-register-container">
            Didn&#39;t receive an email?
            <Button
              type="link"
              className="verify-resend-link"
              onClick={async () => {
                // TODO: error handling for resend?
                await sendVerificationEmail(await getUserEmail());
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
