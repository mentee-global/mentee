import React, { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { useDispatch } from "react-redux";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { NavLink, useHistory } from "react-router-dom";
import { getExistingProfile, isHaveAccount } from "utils/api";
import { login, sendVerificationEmail } from "utils/auth.service";
import { ACCOUNT_TYPE_LABELS, REDIRECTS } from "utils/consts";
import fireauth from "utils/fireauth";
import { fetchUser } from "features/userSlice";

function Login({ role }) {
  const history = useHistory();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async ({ email, password }) => {
    if (!role) return;

    setLoading(true);

    const { isHaveProfile, rightRole } = await getExistingProfile(email, role);
    if (rightRole && parseInt(rightRole) !== role) {
      messageApi.error(t("loginErrors.wrongRole"));
      setLoading(false);
      return;
    }

    const { isHave } = await isHaveAccount(email, role);
    if (isHaveProfile === false && isHave === true) {
      //redirect to apply with role and email passed
      history.push({
        pathname: "/application-page",
        state: { email, role },
      });
    } else if (isHaveProfile === false && isHave === false) {
      messageApi.error(t("loginErrors.incorrectCredentials"));
      setLoading(false);
    } else if (isHaveProfile === true) {
      const res = await login(email, password, role);
      setLoading(false);

      if (!res || !res.success) {
        if (res?.data?.result?.existingEmail) {
          messageApi.error(t("loginErrors.existingEmail"));
          setLoading(false);
        } else {
          messageApi.error(t("loginErrors.incorrectCredentials"));
          setLoading(false);
        }
        return;
      } else if (res.result.passwordReset) {
        messageApi.error(t("loginErrors.resetPassword"));
        history.push("/forgot-password");
      } else if (res.result.recreateAccount) {
        messageApi.error(t("loginErrors.reregisterAccount"));
        history.push("/application-page");
      }
      const unsubscribe = fireauth.auth().onAuthStateChanged(async (user) => {
        unsubscribe();
        if (!user) return;

        if (res.result.redirectToVerify) {
          await sendVerificationEmail(email);
          history.push("/verify");
        } else {
          dispatch(
            fetchUser({
              id: res.result.profileId,
              role,
            })
          );
          history.push(REDIRECTS[role]);
        }
      });
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
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
      <Typography.Title level={2}>{ACCOUNT_TYPE_LABELS[role]}</Typography.Title>
      <Form
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        layout="vertical"
        size="large"
        style={{ width: "100%" }}
      >
        <Form.Item
          name="email"
          label={t("common.email")}
          required
          rules={[
            {
              type: "email",
              message: t("common.inputPrompt"),
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder={t("login.emailPlaceholder")}
            autoFocus
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={t("common.password")}
          required
          rules={[
            {
              message: t("common.inputPrompt"),
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={t("login.passwordPlaceholder")}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "100%" }}
            loading={loading}
          >
            {t("common.login")}
          </Button>
          <NavLink to="/forgot-password">{t("login.forgotPassword")}</NavLink>
        </Form.Item>
      </Form>
    </div>
  );
}

export default Login;
