import React from "react";
import { Link } from "react-router-dom";
import { Result, Button } from "antd";
import { useTranslation } from "react-i18next";

function OAuthError() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 16px" }}>
      <Result
        status="error"
        title={t("oauth_error.title")}
        subTitle={t("oauth_error.body")}
        extra={
          <Link to="/">
            <Button type="primary">{t("oauth_error.back")}</Button>
          </Link>
        }
      />
    </div>
  );
}

export default OAuthError;
