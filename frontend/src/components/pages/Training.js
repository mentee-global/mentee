import TrainingList from "components/TrainingList";
import { withRouter, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { Button, Space, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import { changeStateBuildProfile, getApplicationStatus } from "utils/api";
import LanguageDropdown from "components/LanguageDropdown";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { NEW_APPLICATION_STATUS } from "utils/consts";
import useQuery from "utils/hooks/useQuery";

function Training({ location, history }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const query = useQuery();
  const role = location.state?.role || parseInt(query.get("role"));
  const email = location.state?.email || query.get("email");
  const [applicationData, setApplicationData] = useState(
    location.state?.applicationData
  );

  const [flag, setFlag] = useState(false);

  const [buttonFlag, setButtonFlag] = useState(false);
  if (!role || !email) history.push("/");

  useEffect(() => {
    async function getApplicationData() {
      var result = await getApplicationStatus(email, role);
      setApplicationData(result.application_data);
      if (
        result.application_state === "BuildProfile" ||
        result.application_state === "COMPLETED"
      ) {
        setButtonFlag(false);
      }
      setFlag(!flag);
    }
    if (!applicationData) {
      getApplicationData();
    }
  }, []);

  const onCompleteTraining = async () => {
    if (!role || !email)
      messageApi.error("Could not submit this role's application form");

    setLoading(true);
    let state = await changeStateBuildProfile({
      email,
      role,
      preferred_language: i18n.language,
    }).catch((err) => {
      console.error(err);
      messageApi.error(t("apply.errorConnection"));
    });
    if (state === NEW_APPLICATION_STATUS.BUILDPROFILE) {
      history.push({
        pathname: "/build-profile",
        state: { email, role },
      });
    } else {
      messageApi.error(
        "Application status could not be changed to BuildProfile"
      );
    }
    setLoading(false);
  };

  const allChecked = (value) => {
    if (
      applicationData.application_state === "BuildProfile" ||
      applicationData.application_state === "COMPLETED"
    ) {
      setButtonFlag(false);
    } else {
      setButtonFlag(value);
    }
  };

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        min-height: 100vh;
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
        <Typography.Title level={2}>{t("apply.training")}</Typography.Title>
        <TrainingList
          role={role}
          applicationData={applicationData}
          allChecked={allChecked}
        />
        <br />
        <Button
          type="primary"
          style={{ width: "100%" }}
          loading={loading}
          onClick={onCompleteTraining}
          disabled={!buttonFlag}
        >
          {t("apply.completeTrainings")}
        </Button>
      </div>
    </div>
  );
}

export default withRouter(Training);
