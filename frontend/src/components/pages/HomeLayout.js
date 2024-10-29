import React, { useEffect, useState } from "react";
import { Col, Row, Space, Tooltip } from "antd";
import { useHistory, withRouter } from "react-router-dom";
import { css } from "@emotion/css";
import LanguageDropdown from "components/LanguageDropdown";
// import { ReactComponent as Logo } from "resources/mentee.svg";
import BigLogoImage from "resources/Mentee_logo_letter.png";
// import { ReactComponent as SmallLogo } from "resources/menteeSmall.svg";
import SmallLogoImage from "resources/Mentee_logo_small.png";
import { useMediaQuery } from "react-responsive";
import { FormOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

function HomeLayout({ children, ignoreHomeLayout, allHubData, location }) {
  const { t } = useTranslation();
  const isTablet = useMediaQuery({ query: `(max-width: 991px)` });
  const history = useHistory();
  const [checkFlagInviteLink, setCheckFlagInviteLink] = useState(false);

  useEffect(() => {
    setCheckFlagInviteLink(false);
    Object.keys(allHubData).map((hub_url) => {
      if (allHubData[hub_url].invite_key) {
        if (
          location.pathname ==
          hub_url + "/" + allHubData[hub_url].invite_key
        ) {
          setCheckFlagInviteLink(true);
        }
      }
      return true;
    });
  }, [location, allHubData]);

  const ignoreLayoutPaths = [
    "/application-form",
    "/application-training",
    "/build-profile",
  ];

  const homeLayoutPaths = [
    "/",
    "/login",
    "/mentor/login",
    "/mentee/login",
    "/partner/login",
    "/readonly/login",
    "/admin",
    "/support",
    "/apply",
    "/application-form",
    "/application-training",
    "/build-profile",
    "/forgot-password",
  ];

  if (
    ignoreHomeLayout ||
    ignoreLayoutPaths.includes(location.pathname) ||
    checkFlagInviteLink
  ) {
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
        {/* <SmallLogo
          className={css`
            position: absolute;
            top: 1em;
            left: 1em;
            width: 2em;
            height: 2em;
            cursor: pointer;
          `}
          onClick={() => history.push("/")}
        /> */}
        <img
          src={BigLogoImage}
          alt={""}
          className={css`
            position: absolute;
            top: 1em;
            left: 0.5em;
            height: 50px;
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
              text-aling: center;
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
            {allHubData && allHubData[location.pathname] ? (
              <>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                    verticalAlign: "middle",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    alt=""
                    src={allHubData[location.pathname].image.url}
                    style={{ maxWidth: "100%" }}
                  />
                  <div
                    style={{
                      width: "100%",
                      textAlign: "right",
                      marginBottom: "0px",
                      position: "absolute",
                      bottom: "10px",
                      paddingRight: "20px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "end" }}>
                      <div
                        style={{
                          fontSize: "20px",
                          fontStyle: "italic",
                          paddingTop: "15px",
                        }}
                      >
                        {t("common.powered_by")}
                      </div>
                      <div>
                        {/* <Logo
                          className={css`
                            height: 80px;
                            width: 160px;
                            cursor: pointer;
                            margin-left: 10px;
                          `}
                          onClick={() => history.push("/")}
                        /> */}
                        <img
                          src={BigLogoImage}
                          alt={""}
                          className={css`
                            width: 50px;
                            cursor: pointer;
                            margin-left: 10px;
                          `}
                          onClick={() => history.push("/")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {homeLayoutPaths.includes(location.pathname) && (
                  // <Logo
                  //   className={css`
                  //     width: 100%;
                  //     height: 100%;
                  //     fill-opacity: 0.7;
                  //   `}
                  // />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: "20%",
                    }}
                  >
                    <img
                      src={BigLogoImage}
                      alt={""}
                      className={css`
                        width: 100%;
                        max-width: 200px;
                        fill-opacity: 0.7;
                      `}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Col>
      )}
    </Row>
  );
}

export default withRouter(HomeLayout);
