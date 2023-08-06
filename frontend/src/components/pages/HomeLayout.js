import React from "react";
import { Col, Row, Space, Tooltip } from "antd";
import { useHistory, withRouter } from "react-router-dom";
import { css } from "@emotion/css";
import LanguageDropdown from "components/LanguageDropdown";
import { ReactComponent as Logo } from "resources/mentee.svg";
import { ReactComponent as SmallLogo } from "resources/menteeSmall.svg";
import { useMediaQuery } from "react-responsive";
import { FormOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

function HomeLayout({ children, ignoreHomeLayout, location }) {
  const { t } = useTranslation();
  const isTablet = useMediaQuery({ query: `(max-width: 991px)` });
  const history = useHistory();

  const ignoreLayoutPaths = [
    "/application-form",
    "/application-training",
    "/build-profile",
  ];

  if (ignoreHomeLayout || ignoreLayoutPaths.includes(location.pathname)) {
    return children;
  }

  return (
    <Row
      className={css`
        height: 100vh;
      `}
    >
      <Col
        span={isTablet ? 24 : 11}
        className={css`
          @media (max-width: 991px) and (min-width: 576px) {
            display: flex;
            justify-content: center;
          }
          @media (max-width: 991px) {
            background: linear-gradient(
              126deg,
              rgba(247, 121, 125, 0.3),
              rgba(251, 216, 134, 0.3),
              rgba(246, 79, 89, 0.3)
            );
            background-size: 400% 400%;
            -webkit-animation: Gradient 7s ease infinite;
            animation: Gradient 7s ease infinite;

            @keyframes Gradient {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }
          }
        `}
      >
        <SmallLogo
          className={css`
            position: absolute;
            top: 1em;
            left: 1em;
            width: 2em;
            height: 2em;
            cursor: pointer;
          `}
          onClick={() => history.push("/")}
        />
        <Space
          className={css`
            position: absolute;
            top: 1em;
            right: 1em;
            cursor: pointer;
          `}
          size="middle"
        >
          <Tooltip title={t("common.bug")}>
            <FormOutlined
              className={css`
                font-size: large;
              `}
              onClick={() => window.open("https://forms.gle/DCCFR6du9YckbnhY8")}
            />
          </Tooltip>
          <LanguageDropdown size="large" />
        </Space>

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
              align-self: center;
              min-width: 500px;
            }

            @media (max-width: 575px) {
              width: 100%;
              min-width: 0px;
            }
          `}
        >
          {children}
        </div>
      </Col>
      {!isTablet && (
        <Col
          span={13}
          className={css`
            padding: 1.5em;
          `}
        >
          <div
            className={css`
              padding-left: 4em;
              border-radius: 2em;
              width: 100%;
              height: 100%;
              background: #c6ffdd;
              background: linear-gradient(126deg, #f7797d, #fbd786, #f64f59);
              background-size: 400% 400%;
              -webkit-animation: Gradient 15s ease infinite;
              animation: Gradient 15s ease infinite;

              @keyframes Gradient {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
            `}
          >
            <Logo
              className={css`
                width: 100%;
                height: 100%;
                fill-opacity: 0.7;
              `}
            />
          </div>
        </Col>
      )}
    </Row>
  );
}

export default withRouter(HomeLayout);
