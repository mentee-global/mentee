import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { Result, Space, Typography, message } from "antd";
import { Link, withRouter } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import LanguageDropdown from "components/LanguageDropdown";
import { ACCOUNT_TYPE, NEW_APPLICATION_STATUS } from "utils/consts";
import MentorProfileForm from "./MentorProfileForm";
import MenteeProfileForm from "./MenteeProfileForm";
import PartnerProfileForm from "components/PartnerProfileForm";
import {
  checkStatusByEmail,
  createAccountProfile,
  getApplicationStatus,
  uploadAccountImage,
} from "utils/api";
import { sendVerificationEmail } from "utils/auth.service";
import useQuery from "utils/hooks/useQuery";

function BuildProfile({ location, history }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [inFirebase, setInFirebase] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userState, setUserState] = useState("");
  const [applicationData, setApplicationData] = useState(null);

  const query = useQuery();
  const role = location.state?.role || parseInt(query.get("role"));
  const email = location.state?.email || query.get("email");
  if (!role || !email) history.push("/");

  useEffect(() => {
    async function getUserData() {
      const { in_firebase, is_verified } = await checkStatusByEmail(
        email,
        role
      );
      setInFirebase(in_firebase);
      setIsVerified(is_verified);
      if (!in_firebase) {
        const { state, application_data } = await getApplicationStatus(
          email,
          role
        );
        setUserState(state);
        setApplicationData(application_data);
      }
    }

    getUserData();
  }, []);

  const onSubmit = async (profileData, image, changedImage) => {
    setLoading(true);
    if (!inFirebase) {
      if (userState !== NEW_APPLICATION_STATUS.BUILDPROFILE && !isVerified) {
        messageApi.error(t("commonProfile.errorTrainingSteps"));
        return;
      }
      if (application_data.specializations) {
        profileData.specializations = application_data.specializations;
      }
    }

    const res = await createAccountProfile(profileData, role, inFirebase);
    const accountId = res?.data?.result?.mentorId;

    if (accountId) {
      const verificationRes = await sendVerificationEmail(email);
      if (!verificationRes) {
        messageApi.error(t("verifyEmail.error"));
      }
      if (profileData.changedImage) {
        const uploadImageRes = await uploadAccountImage(
          profileData.image,
          accountId,
          role
        );
        if (!uploadImageRes) {
          messageApi.error(t("commonProfile.error.uploadImage"));
        }
      }
      messageApi.info(t("commonProfile.accountCreated"));
      history.push({ pathname: "/login", state: { email, role } });
    } else {
      messageApi.error(t("commonProfile.error.save"));
    }
    setLoading(false);
  };

  const getProfileForm = () => {
    switch (role) {
      case ACCOUNT_TYPE.MENTOR:
        return (
          <MentorProfileForm
            email={email}
            newProfile
            onSubmit={onSubmit}
            applicationData={applicationData}
            loading={loading}
          />
        );
      case ACCOUNT_TYPE.MENTEE:
        return (
          <MenteeProfileForm
            email={email}
            newProfile
            onSubmit={onSubmit}
            loading={loading}
          />
        );
      case ACCOUNT_TYPE.PARTNER:
        return (
          <PartnerProfileForm
            role={ACCOUNT_TYPE.PARTNER}
            email={email}
            newProfile
            onSubmit={onSubmit}
            loading={loading}
          />
        );
      default:
        return (
          <Result
            status="error"
            title="Could not get this role's profile form"
          />
        );
    }
  };

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
        <Typography.Title level={2}>{t("apply.buildProfile")}</Typography.Title>
        <Typography.Title level={3}>
          {t("commonProfile.welcome")}
        </Typography.Title>
        {getProfileForm()}
      </div>
    </div>
  );
}

export default withRouter(BuildProfile);
