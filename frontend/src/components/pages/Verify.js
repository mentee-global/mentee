import React, { useState } from "react";
import { withRouter, Link } from "react-router-dom";
import { Button, Card, Typography, message } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";

import { sendVerificationEmail } from "utils/auth.service";
import LanguageDropdown from "components/LanguageDropdown";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";

function Verify({ location, history }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [resending, setResending] = useState(false);

  const email = location.state?.email;

  const handleResend = async () => {
    if (!email) {
      messageApi.error(t("verifyEmail.error"));
      return;
    }
    setResending(true);
    const res = await sendVerificationEmail(email);
    setResending(false);
    if (res && (res.success || res.status === 200)) {
      messageApi.success(t("verifyEmail.emailResent"));
    } else {
      messageApi.error({
        content: t("verifyEmail.error"),
        duration: 4,
        key: "verifyEmail.error",
        onClick: () => messageApi.destroy("verifyEmail.error"),
      });
    }
  };

  return (
    <div
      className={css`
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2em 1em;
        box-sizing: border-box;
      `}
    >
      {contextHolder}
      <div
        className={css`
          width: 100%;
          max-width: 560px;
          margin-top: 1em;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5em;
          `}
        >
          <Link to="/">
            <Typography.Text
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                font-size: 0.95em;
              `}
            >
              <ArrowLeftOutlined />
              {t("common.back")}
            </Typography.Text>
          </Link>
          <LanguageDropdown size="large" />
        </div>

        <Card
          bordered={false}
          className={css`
            margin-top: 1.5em;
            border-radius: 1.25em;
            box-shadow: 0 4px 24px rgba(5, 145, 255, 0.08);
            text-align: center;
          `}
          bodyStyle={{ padding: "2.5em 2em" }}
        >
          <div
            className={css`
              display: flex;
              justify-content: center;
              margin-bottom: 1em;
            `}
          >
            <div
              className={css`
                width: 88px;
                height: 88px;
                border-radius: 50%;
                background: #e6f4ff;
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <MailOutlined
                className={css`
                  font-size: 40px;
                  color: #1677ff;
                `}
              />
            </div>
          </div>

          <Typography.Title level={3} style={{ marginBottom: "0.4em" }}>
            {t("verifyEmail.header")}
          </Typography.Title>

          <Typography.Paragraph
            type="secondary"
            style={{ marginBottom: "0.4em" }}
          >
            {t("verifyEmail.body")}
          </Typography.Paragraph>

          {email && (
            <Typography.Paragraph strong style={{ marginBottom: "1.5em" }}>
              {email}
            </Typography.Paragraph>
          )}

          <Button
            type="primary"
            size="large"
            onClick={() => history.push("/login")}
            className={css`
              min-width: 200px;
              border-radius: 999px;
              height: 44px;
            `}
          >
            {t("verifyEmail.logIn")}
          </Button>

          <div
            className={css`
              margin-top: 1.75em;
              padding-top: 1.25em;
              border-top: 1px solid #f0f0f0;
              color: #666;
            `}
          >
            <Typography.Text>{t("verifyEmail.noEmail")}</Typography.Text>{" "}
            <Typography.Link
              disabled={resending || !email}
              onClick={handleResend}
            >
              {t("verifyEmail.resend")}
            </Typography.Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default withRouter(Verify);
