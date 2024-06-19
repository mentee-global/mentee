import React, { useState } from "react";
import { withRouter, Link } from "react-router-dom";
import { Input, Button, message, Form, Typography, Space } from "antd";
import { useTranslation } from "react-i18next";
import { sendPasswordResetEmail } from "utils/auth.service";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { css } from "@emotion/css";

function ForgotPassword({ location, history }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async ({ email }) => {
    setLoading(true);
    setEmail(email);
    const res = await sendPasswordResetEmail(email);
    if (res && res?.success) {
      if (emailSent) {
        messageApi.success(t("forgotPassword.emailResent"));
      } else {
        messageApi.success(t("forgotPassword.sent"));
        setEmailSent(true);
      }
    } else {
      messageApi.error({
        content: t("forgotPassword.error"),
        duration: 0,
        key: "forgotPassword.error",
        onClick: () => messageApi.destroy("forgotPassword.error"),
      });
    }
    setLoading(false);
  };

  const onFinishFailed = (errorInfo) => {
    console.error("Failed:", errorInfo);
    messageApi.error({
      content: t("forgotPassword.error"),
      duration: 0,
      key: "forgotPassword.error",
      onClick: () => messageApi.destroy("forgotPassword.error"),
    });
  };

  return (
    <div
      className={css`
        display: flex;
        width: 100%;
        flex: 1;
        justify-content: center;
        flex-direction: column;

        @media (max-width: 991px) {
          flex: 0;
        }
      `}
    >
      {contextHolder}
      <Link
        to={{
          pathname: "/login",
          state: { role: location.state?.role },
        }}
      >
        <Space>
          <ArrowLeftOutlined />
          {t("common.login")}
        </Space>
      </Link>
      <Typography.Title level={2}>{t("forgotPassword.title")}</Typography.Title>
      <Form
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        layout="vertical"
        size="large"
        style={{ width: "100%" }}
        onValuesChange={() => setEmailSent(false)}
      >
        <Form.Item
          name="email"
          label={t("common.email")}
          rules={[
            {
              required: true,
              type: "email",
              message: t("loginErrors.emailError"),
            },
          ]}
        >
          <Input prefix={<UserOutlined />} autoFocus />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "100%" }}
            loading={loading}
            disabled={emailSent}
          >
            {emailSent
              ? t("forgotPassword.sent")
              : t("forgotPassword.sendLink")}
          </Button>
          <a onClick={() => onFinish({ email })}>
            {t("forgotPassword.notReceiveEmail")}
          </a>
        </Form.Item>
      </Form>
    </div>
  );
}

export default withRouter(ForgotPassword);
