import React, { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useHistory } from "react-router-dom";
import { checkProfileExists, checkStatusByEmail } from "utils/api";
import { login, sendVerificationEmail } from "utils/auth.service";
import { ACCOUNT_TYPE, ACCOUNT_TYPE_LABELS, REDIRECTS } from "utils/consts";
import fireauth from "utils/fireauth";
import { fetchUser } from "features/userSlice";

function LoginForm({ role, defaultEmail, n50_flag, location }) {
  if (!defaultEmail) {
    if (location && location.state && location.state.email) {
      defaultEmail = location.state.email;
    }
  }
  const history = useHistory();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async ({ email, password }) => {
    if (role == null) return;
    setLoading(true);

    // Non-admin checking for status of account
    if (
      role !== ACCOUNT_TYPE.ADMIN &&
      role !== ACCOUNT_TYPE.SUPPORT &&
      role !== ACCOUNT_TYPE.HUB
    ) {
      const { profileExists, rightRole } = await checkProfileExists(
        email,
        role
      );
      if (rightRole && parseInt(rightRole) !== role) {
        messageApi.error({
          content: t("loginErrors.wrongRole"),
          duration: 0,
          key: "loginErrors.wrongRole",
          onClick: () => messageApi.destroy("loginErrors.wrongRole"),
        });
        setLoading(false);
        return;
      }

      const { inFirebase } = await checkStatusByEmail(email, role);
      if (profileExists === false && inFirebase === true) {
        //redirect to apply with role and email passed
        history.push({
          pathname: "/application-page",
          state: { email, role },
        });
      } else if (profileExists === false && inFirebase === false) {
        messageApi.error({
          content: t("loginErrors.incorrectCredentials"),
          duration: 0,
          key: "loginErrors.incorrectCredentials",
          onClick: () => messageApi.destroy("loginErrors.incorrectCredentials"),
        });
        setLoading(false);
        return;
      }
    }

    const res = await login(
      email,
      password,
      role,
      location ? location.pathname : undefined
    );
    if (!res || !res.success) {
      if (res?.data?.result?.existingEmail) {
        messageApi.error({
          content: t("loginErrors.existingEmail"),
          duration: 0,
          key: "loginErrors.existingEmail",
          onClick: () => messageApi.destroy("loginErrors.existingEmail"),
        });
        setLoading(false);
      } else {
        messageApi.error({
          content: t("loginErrors.incorrectCredentials"),
          duration: 0,
          key: "loginErrors.incorrectCredentials",
          onClick: () => messageApi.destroy("loginErrors.incorrectCredentials"),
        });
        setLoading(false);
      }
      return;
    } else if (res.result.passwordReset) {
      messageApi.error({
        content: t("loginErrors.resetPassword"),
        duration: 0,
        key: "loginErrors.resetPassword",
        onClick: () => messageApi.destroy("loginErrors.resetPassword"),
      });
      history.push("/forgot-password");
    } else if (res.result.recreateAccount) {
      messageApi.error({
        content: t("loginErrors.reregisterAccount"),
        duration: 0,
        key: "loginErrors.reregisterAccount",
        onClick: () => messageApi.destroy("loginErrors.reregisterAccount"),
      });
      history.push("/application-page");
    }
    const unsubscribe = fireauth.auth().onAuthStateChanged(async (user) => {
      unsubscribe();
      if (!user) return;
      if (res.result.redirectToVerify) {
        message.info(t("verifyEmail.body"));
        await sendVerificationEmail(email);
      }
      dispatch(
        fetchUser({
          id: res.result.profileId,
          role,
        })
      );
      let direct_path = localStorage.getItem("direct_path");
      if (n50_flag) {
        localStorage.setItem("n50_user", true);
      }
      if (direct_path) {
        setTimeout(() => {
          history.push(direct_path);
        }, 1000);
        setTimeout(() => {
          localStorage.removeItem("direct_path");
        }, 2000);
      } else {
        if (role == ACCOUNT_TYPE.HUB) {
          history.push(location.pathname + REDIRECTS[role]);
        } else {
          history.push(REDIRECTS[role]);
        }
      }
    });
  };

  const onFinishFailed = (errorInfo) => {
    // console.log("Failed:", errorInfo);
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
      <Typography.Title level={2}>
        {t(`common.${ACCOUNT_TYPE_LABELS[role]}`)}
      </Typography.Title>
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
          initialValue={defaultEmail}
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
        <Form.Item
          name="password"
          label={t("common.password")}
          rules={[
            {
              required: true,
              message: t("loginErrors.passwordError"),
            },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            id="submit"
            htmlType="submit"
            style={{ width: "100%" }}
            loading={loading}
          >
            {t("common.login")}
          </Button>
          <Link to={{ pathname: "/forgot-password", state: { role } }}>
            {t("login.forgotPassword")}
          </Link>
        </Form.Item>
      </Form>
    </div>
  );
}

export default LoginForm;
