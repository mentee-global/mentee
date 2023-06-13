import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import { Input, Button } from "antd";
import { useTranslation } from "react-i18next";
import { sendPasswordResetEmail } from "utils/auth.service";
import MenteeButton from "../MenteeButton";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState();
  const [error, setError] = useState(false);
  const [resent, setResent] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [sentLink, setSentLink] = useState(false);

  const handleInputFocus = () => setInputFocus(true);
  const handleInputBlur = () => setInputFocus(false);

  const sendEmail = async (onSuccess) => {
    setError(false);

    const res = await sendPasswordResetEmail(email);
    if (res && res.success) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="home-background">
      <div className="login-content">
        <div className="verify-container">
          <div className="verify-header-container">
            <div className="verify-header-text">
              <h1 className="login-text">{t("forgotPassword.title")}</h1>
              {error && (
                <div className="register-error">
                  {t("forgotPassword.error")}
                </div>
              )}
              {resent && <div>{t("forgotPassword.emailResent")}</div>}
              <br />
              <t className="verify-header-text-description">
                {t("forgotPassword.promptEmail")}
              </t>
            </div>
          </div>
          <div
            className={`login-input-container${inputFocus ? "__clicked" : ""}`}
          >
            <Input
              className="forgot_email"
              onFocus={() => handleInputFocus()}
              onBlur={() => handleInputBlur()}
              onChange={(e) => setEmail(e.target.value)}
              bordered={false}
              placeholder={t("common.email")}
            />
          </div>
          <div className="login-button">
            <MenteeButton
              content={
                <b>
                  {sentLink
                    ? t("forgotPassword.sent")
                    : t("forgotPassword.sendLink")}
                </b>
              }
              loading={sendingLink}
              disabled={sentLink}
              width={"50%"}
              height={"125%"}
              onClick={async () => {
                setSendingLink(true);
                sendEmail(() => setSentLink(true));
                setSendingLink(false);
              }}
            />
          </div>
          <div className="login-register-container">
            {t("forgotPassword.notReceiveEmail")}
            <Button
              type="link"
              className="verify-resend-link"
              onClick={async () => {
                // TODO: error handling for resend?
                sendEmail(() => setResent(true));
              }}
            >
              <u>{t("forgotPassword.resend")}</u>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(ForgotPassword);
