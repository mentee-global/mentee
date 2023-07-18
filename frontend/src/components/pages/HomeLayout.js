import React from "react";
import { Col, Row } from "antd";
import { useHistory, withRouter } from "react-router-dom";
import { css } from "@emotion/css";
import LanguageDropdown from "components/LanguageDropdown";
import { ReactComponent as Logo } from "resources/mentee.svg";
import { ReactComponent as SmallLogo } from "resources/menteeSmall.svg";
import { useMediaQuery } from "react-responsive";

function HomeLayout({ children, ignoreLayout, location }) {
  const isTablet = useMediaQuery({ query: `(max-width: 991px)` });
  const history = useHistory();

  if (ignoreLayout || location.state?.ignoreHomeLayout) {
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
              rgba(198, 255, 221, 0.3)
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
        <LanguageDropdown
          className={css`
            position: absolute;
            top: 1em;
            right: 1em;
            cursor: pointer;
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
              background: linear-gradient(126deg, #f7797d, #fbd786, #c6ffdd);
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
