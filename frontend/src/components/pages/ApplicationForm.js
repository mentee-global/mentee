import React, { useEffect, useState } from "react";
import "../../components/css/Apply.scss";
import { Input, Radio, Result, Typography, message, theme } from "antd";
import { useLocation, useHistory, withRouter } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { ACCOUNT_TYPE } from "utils/consts";
import ApplyStep from "../../resources/applystep.png";
import ApplyStep2 from "../../resources/applystep2.png";
import {
  getApplicationStatus,
  checkStatusByEmail,
  changeStateBuildProfile,
} from "../../utils/api";
import ProfileStep from "../../resources/profilestep.png";
import ProfileStep2 from "../../resources/profilestep2.png";
import TrianStep from "../../resources/trainstep.png";
import TrianStep2 from "../../resources/trainstep2.png";
import MentorApplication from "./MentorApplication";
import MenteeApplication from "./MenteeApplication";
import TrainingList from "components/TrainingList";
import MentorProfileForm from "./MentorProfileForm";
import MenteeProfileForm from "./MenteeProfileForm";
import PartnerProfileForm from "components/PartnerProfileForm";
import { validateEmail } from "utils/misc";
import { css } from "@emotion/css";

const { Title, Paragraph } = Typography;

const getApplicationForm = (role) => {
  switch (role) {
    case ACCOUNT_TYPE.MENTOR:
      return <MentorApplication />;
    case ACCOUNT_TYPE.MENTEE:
      return <MenteeApplication />;
    case ACCOUNT_TYPE.PARTNER:
      return <PartnerProfileForm />;
    default:
      return (
        <Result
          status="error"
          title="Could not get this role's application form"
        />
      );
  }
};

const ApplicationForm = ({ location, history }) => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const { t, i18n } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  console.log(location.state);

  return (
    <div
      className={css`
        width: 100%;
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
          margin: 2em 0;
          box-shadow: 0 1px 4px rgba(5, 145, 255, 0.1);
        `}
      >
        <Typography>
          <Title
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
        {getApplicationForm(location.state.role)}
      </div>
    </div>
  );
};

export default withRouter(ApplicationForm);
