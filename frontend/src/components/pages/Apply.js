import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { css } from "@emotion/css";
import { Button, Form, Input, Space, Typography, message } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

function Apply() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async ({ email }) => {
    setLoading(true);
    setEmail(email);

    setLoading(false);
  };

  const onFinishFailed = (errorInfo) => {
    messageApi.error(`${t("forgotPassword.error")}: ${errorInfo}`);
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
      <Link to={"/"}>
        <Space>
          <ArrowLeftOutlined />
          {t("common.back")}
        </Space>
      </Link>
      <Typography.Title level={2}>{t("common.apply")}</Typography.Title>
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
          >
            {t("common.submit")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default Apply;
