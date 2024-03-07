import TrainingList from "components/TrainingList";
import { withRouter } from "react-router-dom";
import React from "react";
import { css } from "@emotion/css";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";
import { ACCOUNT_TYPE } from "utils/consts";

function TrainingData({ role }) {
  const { t } = useTranslation();

  return (
    <div
      className={css`
        min-width: 400px;
        width: 90%;
        background: #fff;
        border-radius: 2em;
        padding: 2em;
        margin: 1em 0;
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
      <Typography.Title level={2}>
        {role == ACCOUNT_TYPE.HUB
          ? t("sidebars.community_info")
          : t("apply.training")}
      </Typography.Title>
      <TrainingList role={role} />
    </div>
  );
}

export default withRouter(TrainingData);
