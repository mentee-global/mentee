import React, { useState, useEffect, useRef, useCallback } from "react";
import { withRouter, Link } from "react-router-dom";
import { Button, Card, Spin, Typography, message } from "antd";
import {
  ArrowLeftOutlined,
  MailOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";

import fireauth from "utils/fireauth";
import { sendVerificationEmail } from "utils/auth.service";
import { REDIRECTS } from "utils/consts";
import LanguageDropdown from "components/LanguageDropdown";

import "../css/Home.scss";
import "../css/Login.scss";
import "../css/Register.scss";

const STORAGE_KEY = "verify_pending";
const POLL_INTERVAL_MS = 3000;

function readPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function persistState(email, role) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, role }));
  } catch (_) {}
}

function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

function Verify({ location, history }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const persisted = readPersistedState();
  const role = location.state?.role ?? persisted?.role;
  const email = location.state?.email ?? persisted?.email;

  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const pollRef = useRef(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (email != null && role != null) {
      persistState(email, role);
    }
  }, [email, role]);

  const redirectIfPossible = useCallback(() => {
    if (redirectedRef.current) return;
    // If we know the role, send the user to their dashboard.
    // If we don't (e.g. they verified in email then re-opened /verify in
    // a fresh tab, losing localStorage), send them to /login — the
    // backend's redirectToVerify flag will be false now, so login lands
    // them on the dashboard normally.
    const target = role != null ? REDIRECTS[role] : "/login";
    redirectedRef.current = true;
    clearPersistedState();
    history.push(target);
  }, [history, role]);

  const checkVerified = useCallback(async () => {
    const user = fireauth.auth().currentUser;
    if (!user) return false;
    try {
      await user.reload();
    } catch (_) {
      return false;
    }
    const isVerified = !!fireauth.auth().currentUser?.emailVerified;
    if (isVerified) {
      setVerified(true);
      redirectIfPossible();
    }
    return isVerified;
  }, [redirectIfPossible]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = fireauth.auth().onAuthStateChanged(async () => {
      if (cancelled) return;
      setChecking(true);
      await checkVerified();
      if (!cancelled) setChecking(false);
    });

    pollRef.current = setInterval(() => {
      checkVerified();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkVerified]);

  const handleManualCheck = async () => {
    setChecking(true);
    const ok = await checkVerified();
    setChecking(false);
    if (!ok) {
      messageApi.error(t("verifyEmail.notYet"));
    }
  };

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
            {verified ? (
              <CheckCircleFilled
                className={css`
                  font-size: 56px;
                  color: #52c41a;
                `}
              />
            ) : (
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
            )}
          </div>

          <Typography.Title level={3} style={{ marginBottom: "0.4em" }}>
            {verified ? t("verifyEmail.verified") : t("verifyEmail.header")}
          </Typography.Title>

          <Typography.Paragraph
            type="secondary"
            style={{ marginBottom: "0.4em" }}
          >
            {verified ? t("verifyEmail.redirecting") : t("verifyEmail.body")}
          </Typography.Paragraph>

          {email && !verified && (
            <Typography.Paragraph strong style={{ marginBottom: "1.5em" }}>
              {email}
            </Typography.Paragraph>
          )}

          {!verified && (
            <>
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.6em;
                  margin-bottom: 1.5em;
                  min-height: 24px;
                  color: #888;
                  font-size: 0.9em;
                `}
              >
                {checking ? (
                  <>
                    <Spin size="small" />
                    <span>{t("verifyEmail.checking")}</span>
                  </>
                ) : (
                  <span>{t("verifyEmail.waiting")}</span>
                )}
              </div>

              <Button
                type="primary"
                size="large"
                loading={checking}
                onClick={handleManualCheck}
                className={css`
                  min-width: 200px;
                  border-radius: 999px;
                  height: 44px;
                `}
              >
                {t("verifyEmail.checkNow")}
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
            </>
          )}

          {verified && (
            <Spin
              size="large"
              className={css`
                margin-top: 1em;
              `}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default withRouter(Verify);
