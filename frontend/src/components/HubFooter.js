import React from "react";
import { Layout, theme } from "antd";
import { withRouter, useHistory } from "react-router-dom";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";
import "components/css/Navigation.scss";
// import { ReactComponent as Logo } from "resources/mentee.svg";
import BigLogoImage from "resources/Mentee_logo_letter.png";

const { Footer } = Layout;

function HubFooter() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { t } = useTranslation();
  const history = useHistory();
  // TODO: Add a proper admin notifications dropdown
  return (
    <Footer
      className="navigation-footer"
      style={{ background: colorBgContainer }}
      theme="light"
    >
      <div
        style={{ fontSize: "15px", fontStyle: "italic", paddingTop: "10px" }}
      >
        {t("common.powered_by")}
      </div>
      <div>
        {/* <Logo
          className={css`
            height: 50px;
            width: 100px;
            cursor: pointer;
            margin-left: 10px;
          `}
          onClick={() => history.push("/")}
        /> */}
        <img
          src={BigLogoImage}
          alt={""}
          className={css`
            height: 40px;
            cursor: pointer;
          `}
          onClick={() => history.push("/")}
        />
      </div>
    </Footer>
  );
}

export default withRouter(HubFooter);
