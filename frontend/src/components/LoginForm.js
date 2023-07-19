import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useHistory } from "react-router-dom";
import {
  checkProfileExists,
  checkStatusByEmail,
  isHaveAccount,
} from "utils/api";
import { login, sendVerificationEmail } from "utils/auth.service";
import { ACCOUNT_TYPE, ACCOUNT_TYPE_LABELS, REDIRECTS } from "utils/consts";
import fireauth from "utils/fireauth";
import { fetchUser } from "features/userSlice";

function LoginForm({ role, defaultEmail }) {
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
    if (role !== ACCOUNT_TYPE.ADMIN) {
      const { profileExists, rightRole } = await checkProfileExists(
        email,
        role
      );
      if (rightRole && parseInt(rightRole) !== role) {
        messageApi.error(t("loginErrors.wrongRole"));
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
        messageApi.error(t("loginErrors.incorrectCredentials"));
        setLoading(false);
        return;
      }
    }

    const res = await login(email, password, role);
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
      }
    });
  };

  useEffect(() => {
    if (user) {
      history.push(REDIRECTS[role]);
    }
  }, [user]);

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
