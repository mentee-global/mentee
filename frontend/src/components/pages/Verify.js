import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import { Button, Space, Typography, message } from "antd";
import {
  sendVerificationEmail,
  isUserVerified,
  refreshToken,
} from "utils/auth.service";
import { useTranslation } from "react-i18next";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";
import { REDIRECTS } from "utils/consts";
import { Link } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";

function Verify({ location, history }) {
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useTranslation();
  const [verifying, setVerifying] = useState(false);
  const role = location.state?.role;
  const email = location.state?.email;

  return (
    <div>
      {contextHolder}
      <Link
        to={{
          pathname: "/",
        }}
      >
        <Space>
          <ArrowLeftOutlined />
          {t("common.back")}
        </Space>
      </Link>
      <Typography.Title level={2}>{t("verifyEmail.header")}</Typography.Title>
      <Typography.Paragraph>{t("verifyEmail.body")}</Typography.Paragraph>
      <Typography.Paragraph italic type="secondary">
        {t("verifyEmail.refresh")}
      </Typography.Paragraph>
      <Button
        loading={verifying}
        onClick={async () => {
          setVerifying(true);
          await refreshToken();
          const success = await isUserVerified();
          if (success) {
            history.push(REDIRECTS[role]);
          } else {
            message.error(t("verifyEmail.error"));
          }
          setVerifying(false);
        }}
      >
        {t("common.submit")}
      </Button>
      <Typography.Paragraph>
        {t("verifyEmail.noEmail")}
        <Typography.Link
          onClick={async () => {
            // TODO: error handling for resend?
            const res = await sendVerificationEmail(email);

            if (res) {
              messageApi.success(t("verifyEmail.emailResent"));
            } else {
              messageApi.error(t("verifyEmail.error"));
            }
          }}
        >
          {t("verifyEmail.resend")}
        </Typography.Link>
      </Typography.Paragraph>
    </div>
  );
}

export default withRouter(Verify);
