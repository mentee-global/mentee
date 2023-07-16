import React, { useState } from "react";
import { useHistory, NavLink } from "react-router-dom";
import { Carousel, Col, Row, Space, Steps, message } from "antd";
import {
  CompassOutlined,
  PartitionOutlined,
  RightCircleOutlined,
  ToolOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import { useTranslation } from "react-i18next";
import SelectCard from "components/SelectCard";
import { css } from "@emotion/css";
import Login from "components/Login";
import useQuery from "utils/hooks/useQuery";
import LanguageDropdown from "components/LanguageDropdown";
import { ReactComponent as Logo } from "resources/mentee.svg";
import { ReactComponent as SmallLogo } from "resources/menteeSmall.svg";
import { useMediaQuery } from "react-responsive";

const imageStyle = {
  height: "100vh",
  width: "100%",
  padding: "1em",
};

const StepNumeration = {
  initial: 0,
  role: 1,
  login: 2,
};

function Home() {
  const history = useHistory();
  const query = useQuery();
  const { t } = useTranslation();
  const [current, setCurrent] = useState(
    query.get("step") ?? StepNumeration.initial
  );
  const isTablet = useMediaQuery({ query: `(max-width: 991px)` });
  const [role, setRole] = useState(query.get("role"));
  const [messageApi, contextHolder] = message.useMessage();

  const selectCardTitle = (title) => {
    return (
      <div
        className={css`
          display: flex;
          justify-content: space-between;
        `}
      >
        <div>{title}</div>
        <RightCircleOutlined />
      </div>
    );
  };

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
      title: "Initial",
      key: "initial",
      content: (
        <Space direction="vertical" className={SelectCardsStyle} size="middle">
          <SelectCard
            avatar={<UserOutlined />}
            title={selectCardTitle(t("homepage.existingAccountTitle"))}
            description={t("homepage.existingAccountDesc")}
            onClick={() => {
              setCurrent(StepNumeration.role);
            }}
          />
          <SelectCard
            avatar={<UserAddOutlined />}
            title={selectCardTitle(t("homepage.newAccountTitle"))}
            description={t("homepage.newAccountDesc")}
            onClick={() => history.push("/application-page")}
          />
        </Space>
      ),
    },
    {
      title: t("homepage.existingAccountTitle"),
      key: "role",
      content: (
        <Space direction="vertical" className={SelectCardsStyle} size="middle">
          <SelectCard
            avatar={<ToolOutlined />}
            title={selectCardTitle(t("common.mentor"))}
            onClick={() => onClickRole(ACCOUNT_TYPE.MENTOR)}
          />
          <SelectCard
            avatar={<CompassOutlined />}
            title={selectCardTitle(t("common.mentee"))}
            onClick={() => onClickRole(ACCOUNT_TYPE.MENTEE)}
          />
          <SelectCard
            avatar={<PartitionOutlined />}
            title={selectCardTitle(t("common.partner"))}
            onClick={() => onClickRole(ACCOUNT_TYPE.PARTNER)}
          />
        </Space>
      ),
    },
    {
      title: "Login",
      key: "login",
      content: <Login role={role} />,
    },
  ];

  return (
    <Row
      className={css`
        height: 100vh;
      `}
    >
      {contextHolder}
      <Col span={isTablet ? 24 : 11}>
        <SmallLogo
          className={css`
            position: absolute;
            top: 1em;
            left: 1em;
            width: 2em;
            height: 2em;
          `}
        />
        <LanguageDropdown
          className={css`
            position: absolute;
            top: 1em;
            right: 1em;
          `}
          size="large"
        />
        <div
          className={css`
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
            padding: 4em;
            @media (max-width: 991px) {
              padding: 2em;
              padding-top: 6em;
              justify-content: flex-start;
              background: #c6ffdd;
              background: -webkit-linear-gradient(
                126deg,
                #f7797d,
                #fbd786,
                #c6ffdd
              );
              background: linear-gradient(
                300deg,
                rgba(247, 121, 125, 0.3),
                rgba(251, 216, 134, 0.3),
                rgba(198, 255, 221, 0.3)
              );
            }
          `}
        >
          <Steps
            current={current}
            responsive
            size="small"
            items={progressItems}
            onChange={onChangeStep}
          />
          {progressItems[current].content}
        </div>
      </Col>
      {!isTablet && (
        <Col
          span={13}
          className={css`
            padding: 1em;
          `}
        >
          {/* <Carousel autoplay>
          <div>
            <img src={require("resources/dwight.png")} style={imageStyle} />
          </div>
          <div>
            <img src={require("resources/stanley.png")} style={imageStyle} />
          </div>
          <div>
            <img src={require("resources/jim.png")} style={imageStyle} />
          </div>
          <div>
            <img src={require("resources/michael.png")} style={imageStyle} />
          </div>
        </Carousel> */}
          <div
            className={css`
              padding: 2em;
              border-radius: 2em;
              width: 100%;
              height: 100%;
              background: #c6ffdd;
              background: -webkit-linear-gradient(
                126deg,
                #f7797d,
                #fbd786,
                #c6ffdd
              );
              background: linear-gradient(126deg, #f7797d, #fbd786, #c6ffdd);
            `}
          >
            <Logo
              className={css`
                width: 100%;
                height: 100%;
              `}
            />
          </div>
        </Col>
      )}
    </Row>
  );
}

export default Home;
