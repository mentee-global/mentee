import React, { useState } from "react";
import "../../components/css/Apply.scss";
import { Button, Result, Space, Typography, message, theme } from "antd";
import { withRouter, Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { ACCOUNT_TYPE } from "utils/consts";
import MentorApplication from "./MentorApplication";
import MenteeApplication from "./MenteeApplication";
import { css } from "@emotion/css";
import { ArrowLeftOutlined } from "@ant-design/icons";
import LanguageDropdown from "components/LanguageDropdown";

const { Title } = Typography;

const ApplicationForm = ({ location, history }) => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [successfulSubmit, setSuccessfulSubmit] = useState(undefined);
  const role = location.state?.role;
  const email = location.state?.email;

  const onSubmitSuccess = () => {
    setSuccessfulSubmit(true);
  };

  const onSubmitFailure = (message = null) => {
    if (message) {
      messageApi.error(message);
    } else {
      messageApi.error(t("apply.errorConnection"));
    }
  };

  const getApplicationForm = () => {
    if (!role || !email)
      return (
        <Result
          status="error"
          title="Could not get this role's application form"
        />
      );

    switch (role) {
      case ACCOUNT_TYPE.MENTOR:
        return (
          <MentorApplication
            email={email}
            role={role}
            onSubmitFailure={onSubmitFailure}
            onSubmitSuccess={onSubmitSuccess}
          />
        );
      case ACCOUNT_TYPE.MENTEE:
        return (
          <MenteeApplication
            email={email}
            role={role}
            onSubmitFailure={onSubmitFailure}
            onSubmitSuccess={onSubmitSuccess}
          />
        );
      default:
        return (
          <Result
            status="error"
            title="Could not get this role's application form"
          />
        );
    }
  };

  return (
    <div
      className={css`
        width: 100%;
        height: ${successfulSubmit ? "100vh" : "100%"};
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
          <Link to={"/"} id="back">
            <Space>
              <ArrowLeftOutlined />
              {t("common.back")}
            </Space>
          </Link>
          <LanguageDropdown size="large" />
        </div>
        <Typography>
          <Title
            id="welcome"
            level={2}
            className={css`
              span {
                // TODO: Change this span
                color: ${colorPrimary};
              }
            `}
          >
            <Trans i18nKey={"common.welcome"}>
              Welcome to <span>MENTEE!</span>
            </Trans>
          </Title>
        </Typography>
        {successfulSubmit === undefined ? (
          getApplicationForm()
        ) : (
          <Result
            status="success"
            title={t("apply.confirmation")}
            extra={[
              <Button
                type="primary"
                key="back"
                onClick={() => history.push("/")}
              >
                {t("common.back")}
              </Button>,
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default withRouter(ApplicationForm);
