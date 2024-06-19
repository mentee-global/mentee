import React, { useState } from "react";
import { Space, Steps, message } from "antd";
import { withRouter, useHistory } from "react-router-dom";
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
import useQuery from "utils/hooks/useQuery";

const StepNumeration = {
  role: 0,
  login: 1,
};

function Login({ location }) {
  const history = useHistory();
  const { t } = useTranslation();
  const query = useQuery();
  let cur_role = location?.state?.role ?? query.get("role");
  let cur_current = cur_role ? StepNumeration.login : StepNumeration.role;
  if (location && location.pathname) {
    switch (location.pathname) {
      case "/mentor/login":
        cur_role = ACCOUNT_TYPE.MENTOR;
        cur_current = StepNumeration.login;
        break;
      case "/mentee/login":
        cur_role = ACCOUNT_TYPE.MENTEE;
        cur_current = StepNumeration.login;
        break;
      case "/partner/login":
        cur_role = ACCOUNT_TYPE.PARTNER;
        cur_current = StepNumeration.login;
        break;
      case "/readonly/login":
        cur_role = ACCOUNT_TYPE.GUEST;
        cur_current = StepNumeration.login;
        break;
      default:
        break;
    }
  }
  const [role, setRole] = useState(cur_role);
  const email = location?.state?.email ?? query.get("email");
  const [current, setCurrent] = useState(cur_current);

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
    // setRole(role);
    // setCurrent(StepNumeration.login);
    switch (role) {
      case ACCOUNT_TYPE.MENTOR:
        history.push("/mentor/login");
        break;
      case ACCOUNT_TYPE.MENTEE:
        history.push("/mentee/login");
        break;
      case ACCOUNT_TYPE.PARTNER:
        history.push("/partner/login");
        break;
      case ACCOUNT_TYPE.GUEST:
        history.push("/readonly/login");
        break;
      default:
        break;
    }
  };

  const onChangeStep = (newStep) => {
    if (newStep === StepNumeration.login && !role) {
      messageApi.error({
        content: t("loginErrors.noRole"),
        duration: 0,
        key: "loginErrors.noRole",
        onClick: () => messageApi.destroy("loginErrors.noRole"),
      });
      return;
    } else if (newStep !== StepNumeration.login) {
      setCurrent(newStep);
      setRole(null);
      history.push("/login");
    }
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
