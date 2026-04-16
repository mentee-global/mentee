import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, Button, List, Avatar, Typography, Spin, Alert } from "antd";
import {
  MailOutlined,
  UserOutlined,
  SafetyOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { BASE_URL } from "utils/consts";

const SCOPE_META = {
  openid: { icon: <SafetyOutlined />, key: "consent.scope.openid" },
  email: { icon: <MailOutlined />, key: "consent.scope.email" },
  profile: { icon: <UserOutlined />, key: "consent.scope.profile" },
  "mentee.role": { icon: <IdcardOutlined />, key: "consent.scope.role" },
};

function OAuthConsent() {
  const { t } = useTranslation();
  const { search } = useLocation();
  const authorizeToken = new URLSearchParams(search).get("authorize_token");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authorizeToken) {
      setError("missing_token");
      return;
    }
    axios
      .get(`${BASE_URL}oauth/consent-request`, {
        params: { authorize_token: authorizeToken },
        withCredentials: true,
      })
      .then((res) => setData(res.data.result))
      .catch((err) => {
        const code = err?.response?.data?.error || "invalid_token";
        setError(code);
      });
  }, [authorizeToken]);

  if (error) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px" }}>
        <Alert
          type="error"
          message={t(`consent.error.${error}`, {
            defaultValue: t("consent.error.invalid_token"),
          })}
        />
      </div>
    );
  }

  if (!data) {
    return <Spin style={{ display: "block", margin: 80 }} />;
  }

  const postUrl = `${BASE_URL}oauth/authorize`;

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: "0 16px" }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {data.client_logo_url && (
            <Avatar src={data.client_logo_url} size={64} />
          )}
          <Typography.Title level={3} style={{ marginTop: 12 }}>
            {t("consent.title", { clientName: data.client_name })}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            {t("consent.signing_in_as", {
              name: data.user?.name,
              email: data.user?.email,
            })}
          </Typography.Paragraph>
        </div>

        <List
          header={
            <strong>
              {t("consent.permissions_header", {
                clientName: data.client_name,
              })}
            </strong>
          }
          dataSource={data.scopes || []}
          renderItem={(s) => (
            <List.Item>
              <List.Item.Meta
                avatar={SCOPE_META[s]?.icon ?? <SafetyOutlined />}
                title={t(SCOPE_META[s]?.key ?? "consent.scope.custom", {
                  scope: s,
                })}
              />
            </List.Item>
          )}
        />

        {/* Native HTML form so the browser follows the backend 303 → 302
            to the client's redirect_uri. Axios would swallow the
            cross-origin redirect. */}
        <form
          action={postUrl}
          method="POST"
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <input type="hidden" name="authorize_token" value={authorizeToken} />
          <Button htmlType="submit" name="decision" value="deny">
            {t("consent.deny")}
          </Button>
          <Button
            htmlType="submit"
            name="decision"
            value="approve"
            type="primary"
          >
            {t("consent.approve")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default OAuthConsent;
