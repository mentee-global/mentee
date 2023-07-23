import React, { useState } from "react";
import { Space, Steps, message } from "antd";
import { withRouter } from "react-router-dom";
import {
  CompassOutlined,
  PartitionOutlined,
  ToolOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import { useTranslation } from "react-i18next";
import SelectCard from "components/SelectCard";
import { css } from "@emotion/css";
import LoginForm from "components/LoginForm";

const StepNumeration = {
  role: 0,
  login: 1,
};

function Login({ location }) {
  const { t } = useTranslation();
  const [role, setRole] = useState(location?.state?.role);
  const email = location?.state?.email;
  const [current, setCurrent] = useState(
    role ? StepNumeration.login : StepNumeration.role
  );
  const [messageApi, contextHolder] = message.useMessage();

  const SelectCardsStyle = css`
    width: 100%;
    flex: 1;
    justify-content: center;
    @media (max-width: 991px) {
      flex: 0;
      margin-top: 5em;
    }
  `;

  const onClickRole = (role) => {
    setRole(role);
    setCurrent(StepNumeration.login);
  };

  const onChangeStep = (newStep) => {
    if (newStep === StepNumeration.login && !role) {
      messageApi.error(t("loginErrors.noRole"));
      return;
    } else if (newStep !== StepNumeration.login) {
      setRole(null);
    }
    setCurrent(newStep);
  };

  const progressItems = [
    {
      title: t("common.role"),
      key: "role",
      content: (
        <Space direction="vertical" className={SelectCardsStyle} size="middle">
          <SelectCard
            avatar={<ToolOutlined />}
            title={t("common.mentor")}
            onClick={() => onClickRole(ACCOUNT_TYPE.MENTOR)}
          />
          <SelectCard
            avatar={<CompassOutlined />}
            title={t("common.mentee")}
            onClick={() => onClickRole(ACCOUNT_TYPE.MENTEE)}
          />
          <SelectCard
            avatar={<PartitionOutlined />}
            title={t("common.partner")}
            onClick={() => onClickRole(ACCOUNT_TYPE.PARTNER)}
          />
          <SelectCard
            avatar={<UnlockOutlined />}
            title={t("common.guest")}
            onClick={() => onClickRole(ACCOUNT_TYPE.GUEST)}
          />
        </Space>
      ),
    },
    {
      title: "Login",
      key: "login",
      content: <LoginForm role={role} defaultEmail={email} />,
    },
  ];

  return (
    <>
      {contextHolder}
      <Steps
        current={current}
        responsive
        size="small"
        items={progressItems}
        onChange={onChangeStep}
      />
      {progressItems[current].content}
    </>
  );
}

export default withRouter(Login);
