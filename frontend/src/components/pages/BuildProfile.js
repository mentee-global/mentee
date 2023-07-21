import React from "react";
import { css } from "@emotion/css";
import { Result, Space, Typography, message } from "antd";
import { Link, withRouter } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import LanguageDropdown from "components/LanguageDropdown";
import { ACCOUNT_TYPE } from "utils/consts";
import MentorProfileForm from "./MentorProfileForm";
import MenteeProfileForm from "./MenteeProfileForm";
import PartnerProfileForm from "components/PartnerProfileForm";

const getProfileForm = (role, email) => {
  switch (role) {
    case ACCOUNT_TYPE.MENTOR:
      return (
        <MentorProfileForm
          role={ACCOUNT_TYPE.MENTOR}
          email={email}
          newProfile
        />
      );
    case ACCOUNT_TYPE.MENTEE:
      return (
        <MenteeProfileForm
          role={ACCOUNT_TYPE.MENTEE}
          email={email}
          newProfile
        />
      );
    case ACCOUNT_TYPE.PARTNER:
      return (
        <PartnerProfileForm
          role={ACCOUNT_TYPE.PARTNER}
          email={email}
          newProfile
        />
      );
    default:
      return (
        <Result status="error" title="Could not get this role's profile form" />
      );
  }
};

function BuildProfile({ location, history }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const role = location.state?.role;
  const email = location.state?.email;

  return (
    <div
      className={css`
        width: 100%;
        min-height: 100vh;
        height: 100%;
        overflow: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      `}
    >
      {contextHolder}
      <div
        className={css`
          min-width: 400px;
          width: 70%;
          background: #fff;
          border-radius: 2em;
          padding: 2em;
          margin: 4em 0;
          box-shadow: 0 1px 4px rgba(5, 145, 255, 0.1);

          @media (max-width: 991px) {
            width: 90%;
            margin: 2em 0;
          }

          @media (max-width: 575px) {
            width: 100%;
            margin: 0;
            border-radius: 0;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            flex-direction: row;
          `}
        >
          <Link to={"/"}>
            <Space>
              <ArrowLeftOutlined />
              {t("common.back")}
            </Space>
          </Link>
          <LanguageDropdown size="large" />
        </div>
        <Typography.Title level={2}>
          <span>{t("apply.buildProfile")}</span>
        </Typography.Title>
        {getProfileForm(role, email)}
      </div>
    </div>
  );
}

export default withRouter(BuildProfile);
