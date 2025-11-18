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

function BuildProfile({ location, history, hub_user }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [inFirebase, setInFirebase] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userState, setUserState] = useState("");
  const [applicationData, setApplicationData] = useState(null);

  const query = useQuery();
  var role = location.state?.role || parseInt(query.get("role"));
  if (hub_user) {
    role = ACCOUNT_TYPE.PARTNER;
  }
  const email = location.state?.email || query.get("email");
  if (!hub_user) {
    if (!role || !email) history.push("/");
  }
  var n50_flag = false;
  if (location && location.pathname.includes("n50")) {
    n50_flag = true;
  }

  useEffect(() => {
    async function getUserData() {
      const { in_firebase, is_verified, profileExists } =
        await checkStatusByEmail(email, role);
      if (profileExists) {
        history.push({
          pathname: "/login",
          state: { email, role },
        });
      }
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
    if (!profileData.image) {
      messageApi.error({
        content: t("common.requiredAvatar"),
        duration: 0,
        key: "requiredAvatar",
      });
      return;
    }
    setLoading(true);
    if (!inFirebase && role !== ACCOUNT_TYPE.PARTNER) {
      if (userState !== NEW_APPLICATION_STATUS.BUILDPROFILE && !isVerified) {
        messageApi.error({
          content: t("commonProfile.errorTrainingSteps"),
          duration: 0,
          key: "errorTrainingSteps",
          onClick: () => messageApi.destroy("errorTrainingSteps"),
        });
        return;
      }
    }

    const res = await createAccountProfile(profileData, role, inFirebase);
    const accountId = res?.data?.result?.mentorId;

    if (accountId) {
      var email_new_registered = email ? email : res?.data?.result?.email;
      const verificationRes = await sendVerificationEmail(email_new_registered);
      if (!verificationRes) {
        messageApi.error({
          content: t("verifyEmail.error"),
          duration: 0,
          key: "verifyEmail",
          onClick: () => messageApi.destroy("verifyEmail"),
        });
      }
      if (profileData.changedImage) {
        const uploadImageRes = await uploadAccountImage(
          profileData.image,
          accountId,
          role
        );
        if (!uploadImageRes) {
          messageApi.error({
            content: t("commonProfile.error.uploadImage"),
            duration: 0,
            key: "commonProfile.error.uploadImage",
            onClick: () =>
              messageApi.destroy("commonProfile.error.uploadImage"),
          });
        }
      }
      messageApi.info(t("commonProfile.accountCreated"));
      let path = "";
      if (role === ACCOUNT_TYPE.MENTOR) {
        path = n50_flag ? "/n50/mentor" : "/mentor";
      }
      if (role === ACCOUNT_TYPE.MENTEE) {
        path = n50_flag ? "/n50/mentee" : "/mentee";
      }
      if (role === ACCOUNT_TYPE.PARTNER) {
        path = "/partner";
      }
      if (role === ACCOUNT_TYPE.GUEST) {
        path = "/readonly";
      }
      if (hub_user) {
        history.push({
          pathname: "/" + hub_user.url,
          state: { email: email_new_registered, role },
        });
      } else {
        history.push({
          pathname: path + "/login",
          state: { email: email_new_registered, role },
        });
      }
    } else {
      messageApi.error({
        content: t("commonProfile.error.save"),
        duration: 0,
        key: "commonProfile.error.save",
        onClick: () => messageApi.destroy("commonProfile.error.save"),
      });
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
            n50_flag={n50_flag}
          />
        );
      case ACCOUNT_TYPE.MENTEE:
        return (
          <MenteeProfileForm
            email={email}
            newProfile
            onSubmit={onSubmit}
            applicationData={applicationData}
            loading={loading}
            n50_flag={n50_flag}
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
            hub_user={hub_user}
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
          width: 70%;
          max-width: 800px;
          background: #fff;
          border-radius: 2em;
          padding: 2em;
          margin: 4em auto;
          box-shadow: 0 1px 4px rgba(5, 145, 255, 0.1);

          @media (max-width: 991px) {
            width: 90%;
            margin: 2em auto;
            padding: 1.5em;
          }

          @media (max-width: 768px) {
            width: 95%;
            padding: 1.5em;
            margin: 1em auto;
          }

          @media (max-width: 575px) {
            width: 100%;
            margin: 0 auto;
            padding: 1em;
            border-radius: 0;
          }
        `}
      >
        <div
          className={css`
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-direction: row;
            margin-bottom: 1em;

            @media (max-width: 575px) {
              flex-wrap: wrap;
              gap: 0.5em;
            }
          `}
        >
          <Link to={"/"} id="back">
            <Space>
              <ArrowLeftOutlined />
              {t("common.back")}
            </Space>
          </Link>
          <LanguageDropdown size="large" />
        </div>
        <Typography.Title 
          level={2}
          style={{ textAlign: 'center', width: '100%' }}
          className={css`
            @media (max-width: 575px) {
              font-size: 1.5em !important;
            }
          `}
        >
          {t("apply.buildProfile")}
        </Typography.Title>
        <Typography.Title 
          level={3}
          style={{ textAlign: 'center', width: '100%' }}
          className={css`
            @media (max-width: 575px) {
              font-size: 1.2em !important;
            }
          `}
        >
          {t("commonProfile.welcome")}
        </Typography.Title>
        {getProfileForm()}
      </div>
    </div>
  );
}

export default withRouter(BuildProfile);
